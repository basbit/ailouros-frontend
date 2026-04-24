import { ref, watch, computed } from "vue";
import {
  applyOnboardingConfig,
  applyOnboardingMcpConfig,
  getLiveOnboardingAssignments,
  preconfigureOnboarding,
  runOnboardingMcpPreflight,
  scanOnboardingWorkspace,
} from "@/shared/api/endpoints/onboarding";
import type {
  ScanResult,
  MCPServerSpec,
  PreconfigResult,
  PreflightInfo,
  PreflightRecommendation,
  ModelAssignment,
} from "@/shared/model/onboarding-types";

export interface OnboardingWizardEmits {
  applied: () => void;
  dismissed: () => void;
  "model-assignments": (assignments: ModelAssignment[]) => void;
}

export interface SearchApiKeys {
  tavily_api_key?: string;
  exa_api_key?: string;
  scrapingdog_api_key?: string;
}

export function useOnboardingWizard(
  workspaceRoot: () => string,
  emit: {
    (event: "applied"): void;
    (event: "dismissed"): void;
    (event: "model-assignments", assignments: ModelAssignment[]): void;
  },
  getSearchKeys?: () => SearchApiKeys,
) {
  // ── State ──────────────────────────────────────────────────────────────────
  const step = ref<1 | 2 | 3>(1);
  const localRoot = ref(workspaceRoot() || "");
  const scanning = ref(false);
  const preconfigurating = ref(false);
  const applying = ref(false);
  const runningPreflight = ref(false);
  const isCollapsed = ref(false);
  const scanResult = ref<ScanResult | null>(null);
  const preconfigResult = ref<PreconfigResult | null>(null);
  const mcpServers = ref<MCPServerSpec[]>([]);
  const mcpPreflight = ref<Record<string, PreflightInfo>>({});
  const recommendedCapabilities = ref<PreflightRecommendation[]>([]);
  const recommendedServers = ref<PreflightRecommendation[]>([]);
  const modelAssignments = ref<ModelAssignment[]>([]);
  const contextPreview = ref("");
  const scanError = ref("");
  const applyError = ref("");
  const contextFileExists = ref(false);

  const shouldShow = computed(() => Boolean(localRoot.value || workspaceRoot()));
  const hasPreflight = computed(() => Object.keys(mcpPreflight.value).length > 0);

  // ── Watch workspace root prop ──────────────────────────────────────────────
  watch(
    workspaceRoot,
    async (root) => {
      if (!root) return;
      localRoot.value = root;
      await checkContextFile(root);
    },
    { immediate: true },
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function checkContextFile(root: string): Promise<void> {
    try {
      const data: ScanResult = await scanOnboardingWorkspace(root);
      contextFileExists.value = data.context_file_exists;
      if (data.context_file_exists) {
        isCollapsed.value = true;
      }
    } catch {
      // ignore — show wizard by default
    }
  }

  function getDefaultMcpForStack(
    stack: string[],
    workspaceHasGitRepo: boolean,
  ): MCPServerSpec[] {
    const root = localRoot.value;
    const servers: MCPServerSpec[] = [
      {
        name: "filesystem",
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", root],
        enabled: true,
        reason: "File access for agents — reduces context by fetching files on demand",
        package: "@modelcontextprotocol/server-filesystem",
      },
    ];
    if (workspaceHasGitRepo) {
      servers.push({
        name: "git",
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-git", "--repository", root],
        enabled: true,
        reason: "Git operations without passing full history in context",
        package: "@modelcontextprotocol/server-git",
      });
    }
    if (stack.includes("nodejs")) {
      servers.push({
        name: "everything",
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
        enabled: true,
        reason: "Additional tools for Node.js projects",
        package: "@modelcontextprotocol/server-everything",
      });
    }
    return servers;
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function runScan(): Promise<void> {
    scanning.value = true;
    scanError.value = "";
    try {
      scanResult.value = await scanOnboardingWorkspace(localRoot.value);
      contextPreview.value = scanResult.value?.proposed_config_preview ?? "";
      mcpServers.value = getDefaultMcpForStack(
        scanResult.value?.detected_stack ?? [],
        scanResult.value?.workspace_has_git_repo ?? false,
      );
      step.value = 2;
    } catch (e) {
      scanError.value = e instanceof Error ? e.message : String(e);
    } finally {
      scanning.value = false;
    }
  }

  async function runAiPreconfigure(): Promise<void> {
    preconfigurating.value = true;
    scanError.value = "";
    try {
      preconfigResult.value = await preconfigureOnboarding(localRoot.value);
      contextPreview.value = (preconfigResult.value?.priority_paths ?? []).join("\n");
      mcpServers.value = preconfigResult.value?.mcp_recommendations ?? [];

      scanResult.value = await scanOnboardingWorkspace(localRoot.value);
      modelAssignments.value = await getLiveOnboardingAssignments(localRoot.value);

      step.value = 2;
    } catch (e) {
      scanError.value = e instanceof Error ? e.message : String(e);
    } finally {
      preconfigurating.value = false;
    }
  }

  async function applyConfig(includeMcp: boolean): Promise<void> {
    applying.value = true;
    applyError.value = "";
    try {
      await applyOnboardingConfig(localRoot.value, contextPreview.value);

      if (includeMcp && mcpServers.value.filter((s) => s.enabled).length > 0) {
        await applyOnboardingMcpConfig(
          localRoot.value,
          mcpServers.value.filter((s) => s.enabled),
        );
      }

      step.value = 3;
      emit("applied");
      if (modelAssignments.value.length > 0) {
        emit("model-assignments", modelAssignments.value);
      }

      if (includeMcp) {
        await runMcpPreflight();
      }
    } catch (e) {
      applyError.value = e instanceof Error ? e.message : String(e);
    } finally {
      applying.value = false;
    }
  }

  async function runMcpPreflight(): Promise<void> {
    runningPreflight.value = true;
    const enabled = mcpServers.value.filter((s) => s.enabled);
    const pending: Record<string, PreflightInfo> = {};
    enabled.forEach((s) => {
      pending[s.name] = { status: "pending" };
    });
    mcpPreflight.value = pending;
    recommendedCapabilities.value = [];
    recommendedServers.value = [];

    try {
      const searchKeys = getSearchKeys ? getSearchKeys() : {};
      const results = await runOnboardingMcpPreflight(localRoot.value, searchKeys);
      if (results.servers) {
        Object.entries(results.servers).forEach(([name, result]) => {
          mcpPreflight.value[name] = {
            status: result.status === "ok" ? "ok" : "failed",
            latency: result.latency_ms,
            tool_count: result.tool_count,
            error: result.error,
          };
        });
      }
      recommendedCapabilities.value = results.recommended_capabilities ?? [];
      recommendedServers.value = results.recommended_servers ?? [];
    } catch {
      enabled.forEach((s) => {
        mcpPreflight.value[s.name] = {
          status: "failed",
          error: "Preflight request failed",
        };
      });
      recommendedCapabilities.value = [];
      recommendedServers.value = [];
    } finally {
      runningPreflight.value = false;
    }
  }

  async function reRunPreconfigure(): Promise<void> {
    scanResult.value = null;
    preconfigResult.value = null;
    mcpPreflight.value = {};
    recommendedCapabilities.value = [];
    recommendedServers.value = [];
    applyError.value = "";
    await runAiPreconfigure();
    if (modelAssignments.value.length > 0) {
      emit("model-assignments", modelAssignments.value);
    }
  }

  return {
    // state
    step,
    localRoot,
    scanning,
    preconfigurating,
    applying,
    runningPreflight,
    isCollapsed,
    scanResult,
    preconfigResult,
    mcpServers,
    mcpPreflight,
    recommendedCapabilities,
    recommendedServers,
    modelAssignments,
    contextPreview,
    scanError,
    applyError,
    contextFileExists,
    // computed
    shouldShow,
    hasPreflight,
    // actions
    runScan,
    runAiPreconfigure,
    applyConfig,
    runMcpPreflight,
    reRunPreconfigure,
  };
}
