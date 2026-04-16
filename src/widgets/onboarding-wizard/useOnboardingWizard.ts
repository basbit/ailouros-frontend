import { ref, watch, computed } from "vue";
import { apiUrl } from "@/shared/api/base";
import type {
  ScanResult,
  MCPServerSpec,
  PreconfigResult,
  PreflightInfo,
  PreflightRecommendation,
  ModelAssignment,
} from "@/features/onboarding/onboarding-types";

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
      const r = await fetch(
        apiUrl(`/v1/onboarding/scan?workspace_root=${encodeURIComponent(root)}`),
      );
      if (!r.ok) return;
      const data: ScanResult = await r.json();
      contextFileExists.value = data.context_file_exists;
      if (data.context_file_exists) {
        isCollapsed.value = true;
      }
    } catch {
      // ignore — show wizard by default
    }
  }

  function getDefaultMcpForStack(stack: string[]): MCPServerSpec[] {
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
      {
        name: "git",
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-git", "--repository", root],
        enabled: true,
        reason: "Git operations without passing full history in context",
        package: "@modelcontextprotocol/server-git",
      },
    ];
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
      const r = await fetch(
        apiUrl(
          `/v1/onboarding/scan?workspace_root=${encodeURIComponent(localRoot.value)}`,
        ),
      );
      if (!r.ok) throw new Error(`Scan failed: ${r.status}`);
      scanResult.value = await r.json();
      contextPreview.value = scanResult.value?.proposed_config_preview ?? "";
      mcpServers.value = getDefaultMcpForStack(scanResult.value?.detected_stack ?? []);
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
      const r = await fetch(apiUrl("/v1/onboarding/preconfigure"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_root: localRoot.value }),
      });
      if (!r.ok) throw new Error(`Pre-configure failed: ${r.status}`);
      preconfigResult.value = await r.json();
      contextPreview.value = (preconfigResult.value?.priority_paths ?? []).join("\n");
      mcpServers.value = preconfigResult.value?.mcp_recommendations ?? [];

      const scanR = await fetch(
        apiUrl(
          `/v1/onboarding/scan?workspace_root=${encodeURIComponent(localRoot.value)}`,
        ),
      );
      if (scanR.ok) scanResult.value = await scanR.json();

      const modelsR = await fetch(
        apiUrl(
          `/v1/onboarding/models?workspace_root=${encodeURIComponent(localRoot.value)}`,
        ),
      );
      if (modelsR.ok) {
        const modelsData = await modelsR.json();
        modelAssignments.value =
          (modelsData.assignments ?? modelsData.config?.roles)
            ? (
                Object.entries(modelsData.config?.roles ?? {}) as [
                  string,
                  { model_id?: string; provider?: string; reason?: string },
                ][]
              ).map(([role, info]) => ({
                role,
                model_id: info.model_id ?? "",
                provider: info.provider ?? "",
                reason: info.reason ?? "",
              }))
            : [];
      }

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
      const r = await fetch(apiUrl("/v1/onboarding/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_root: localRoot.value,
          content: contextPreview.value,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail ?? `Apply failed: ${r.status}`,
        );
      }

      if (includeMcp && mcpServers.value.filter((s) => s.enabled).length > 0) {
        const mcpR = await fetch(apiUrl("/v1/onboarding/mcp-config/apply"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace_root: localRoot.value,
            servers: mcpServers.value.filter((s) => s.enabled),
          }),
        });
        if (!mcpR.ok) {
          const err = await mcpR.json().catch(() => ({}));
          throw new Error(
            (err as { detail?: string }).detail ?? `MCP apply failed: ${mcpR.status}`,
          );
        }
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
      const r = await fetch(apiUrl("/v1/onboarding/mcp-preflight"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_root: localRoot.value, ...searchKeys }),
      });
      if (!r.ok) throw new Error(`Preflight failed: ${r.status}`);
      const results = (await r.json()) as {
        servers?: Record<
          string,
          { status: string; latency_ms?: number; tool_count?: number; error?: string }
        >;
        recommended_capabilities?: PreflightRecommendation[];
        recommended_servers?: PreflightRecommendation[];
      };
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
