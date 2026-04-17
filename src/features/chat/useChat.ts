import { ref } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { ROLES } from "@/shared/lib/pipeline-schema";
import type { useSettings } from "@/features/project-settings/useSettings";
import {
  TOPOLOGY_PRESETS,
  deriveStagesForTopology,
} from "@/features/pipeline/topologyPresets";

/** Reactive error message for user-facing validation errors. */
export const errorMessage = ref<string | null>(null);

type SettingsRef = ReturnType<typeof useSettings>;

interface DocSourceEntry {
  url: string;
  title?: string;
  note?: string;
}

function parseDocumentationSourceLines(text: string): DocSourceEntry[] {
  const entries: DocSourceEntry[] = [];
  const lines = (text ?? "").replace(/\r/g, "").split("\n");

  function isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.charAt(0) === "#") continue;
    let url = "";
    let title = "";
    let note = "";
    const separator = " | ";
    const lastSeparatorIndex = line.lastIndexOf(separator);
    if (lastSeparatorIndex >= 0) {
      url = line.slice(lastSeparatorIndex + separator.length).trim();
      const rest = line.slice(0, lastSeparatorIndex).trim();
      const firstSeparatorIndex = rest.indexOf(separator);
      if (firstSeparatorIndex >= 0) {
        title = rest.slice(0, firstSeparatorIndex).trim();
        note = rest.slice(firstSeparatorIndex + separator.length).trim();
      } else {
        title = rest;
      }
    } else {
      url = line;
    }
    if (!isValidHttpUrl(url)) continue;
    const entry: DocSourceEntry = { url };
    if (title) entry.title = title;
    if (note) entry.note = note;
    entries.push(entry);
  }
  return entries;
}

function normalizeMcpConfig(parsed: unknown): { servers: unknown[] } | null {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const raw = parsed as Record<string, unknown>;
  if (Array.isArray(raw.servers) && raw.servers.length) return { servers: raw.servers };
  const mcpServers = raw.mcpServers;
  if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers))
    return null;
  const servers: unknown[] = [];
  for (const [serverName, value] of Object.entries(
    mcpServers as Record<string, unknown>,
  )) {
    if (!value || typeof value !== "object") continue;
    const serverEntry = value as Record<string, unknown>;
    if (serverEntry.command === undefined || serverEntry.command === null) continue;
    const normalized: Record<string, unknown> = {
      name: String(serverName).trim() || "mcp",
      command: serverEntry.command,
    };
    if (Array.isArray(serverEntry.args) && serverEntry.args.length)
      normalized.args = serverEntry.args;
    if (serverEntry.cwd) normalized.cwd = serverEntry.cwd;
    if (serverEntry.env && typeof serverEntry.env === "object")
      normalized.env = serverEntry.env;
    servers.push(normalized);
  }
  if (!servers.length) return null;
  return { servers };
}

// ── Focused config builders ────────────────────────────────────────────────

function _buildProfilesConfig(
  profilesState: SettingsRef["profilesState"],
  t: ReturnType<typeof useI18n>["t"],
): Record<string, unknown> | null {
  const duplicateIds = profilesState.getDuplicateIds();
  if (duplicateIds.length) {
    errorMessage.value = t("errors.duplicateProfileId", {
      ids: duplicateIds.join(", "),
    });
    return null;
  }
  const profileIdPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  const profilesObject = profilesState.collectAsObject();
  const invalidIds = Object.keys(profilesObject).filter(
    (id) => !profileIdPattern.test(id),
  );
  if (invalidIds.length) {
    errorMessage.value = t("errors.invalidProfileId", { ids: invalidIds.join(", ") });
    return null;
  }
  return profilesObject;
}

function _buildRolesConfig(
  rolesState: SettingsRef["rolesState"],
  devRolesState: SettingsRef["devRolesState"],
  form: SettingsRef["form"],
): Record<string, unknown> {
  const config: Record<string, unknown> = Object.fromEntries(
    ROLES.map((r) => [r, rolesState.collectRoleApiConfig(r)]),
  );

  const devRolesArray = devRolesState.collectForApi();
  if (devRolesArray.length) config.dev_roles = devRolesArray;

  if (form.human_manual_review) {
    config.human = { require_manual: true, auto_approve: false };
  }

  return config;
}

function _buildSwarmSection(form: SettingsRef["form"]): Record<string, unknown> {
  const swarm: Record<string, unknown> = {};

  const languagesRaw = form.swarm_languages.trim();
  if (languagesRaw) {
    swarm.languages = languagesRaw
      .split(/[\s,]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (form.swarm_topology.trim()) swarm.topology = form.swarm_topology.trim();
  if (form.swarm_pattern_memory) swarm.pattern_memory = true;
  const pipelineHooksModule = form.swarm_pipeline_hooks_module.trim();
  if (pipelineHooksModule) swarm.pipeline_hooks_module = pipelineHooksModule;
  if (!form.swarm_mcp_auto) swarm.mcp_auto = false;
  if (form.swarm_skip_mcp_tools) swarm.skip_mcp_tools = true;
  const documentationLocale = form.swarm_doc_locale.trim();
  if (documentationLocale) swarm.documentation_locale = documentationLocale;
  const documentationText = form.swarm_documentation_sources.trim();
  if (documentationText) {
    const sources = parseDocumentationSourceLines(documentationText);
    if (sources.length) swarm.documentation_sources = sources;
  }
  const databaseUrl = form.swarm_database_url.trim();
  if (databaseUrl) swarm.database_url = databaseUrl;
  const databaseHint = form.swarm_database_hint.trim();
  if (databaseHint) swarm.database_hint = databaseHint;
  if (!form.swarm_database_readonly) swarm.database_readonly = false;
  if (form.swarm_disable_tree_sitter) swarm.disable_tree_sitter = true;
  if (form.swarm_self_verify) swarm.self_verify = true;
  const selfVerifyProvider = form.swarm_self_verify_provider.trim();
  if (selfVerifyProvider) swarm.self_verify_provider = selfVerifyProvider;
  const selfVerifyModel = form.swarm_self_verify_model.trim();
  if (selfVerifyModel) swarm.self_verify_model = selfVerifyModel;
  const autoApproveValue = form.swarm_auto_approve.trim();
  if (autoApproveValue) swarm.auto_approve = autoApproveValue;
  const autoApproveTimeout = parseInt(form.swarm_auto_approve_timeout.trim(), 10);
  if (!isNaN(autoApproveTimeout) && autoApproveTimeout > 0)
    swarm.auto_approve_timeout = autoApproveTimeout;
  if (form.swarm_auto_retry) swarm.auto_retry = true;
  const maxStepRetries = parseInt(form.swarm_max_step_retries.trim(), 10);
  if (!isNaN(maxStepRetries) && maxStepRetries > 0)
    swarm.max_step_retries = maxStepRetries;
  if (form.swarm_deep_planning) swarm.deep_planning = true;
  const deepPlanningProvider = form.swarm_deep_planning_provider.trim();
  if (deepPlanningProvider) swarm.deep_planning_provider = deepPlanningProvider;
  const deepPlanningModel = form.swarm_deep_planning_model.trim();
  if (deepPlanningModel) swarm.deep_planning_model = deepPlanningModel;
  if (form.swarm_background_agent) swarm.background_agent = true;
  const backgroundAgentProvider = form.swarm_background_agent_provider.trim();
  if (backgroundAgentProvider)
    swarm.background_agent_provider = backgroundAgentProvider;
  const backgroundAgentModel = form.swarm_background_agent_model.trim();
  if (backgroundAgentModel) swarm.background_agent_model = backgroundAgentModel;
  const backgroundWatchPaths = form.swarm_background_watch_paths.trim();
  if (backgroundWatchPaths) swarm.background_watch_paths = backgroundWatchPaths;
  if (form.swarm_dream_enabled) swarm.dream_enabled = true;
  if (form.swarm_quality_gate) swarm.quality_gate_enabled = true;
  const tavilyApiKey = form.swarm_tavily_api_key.trim();
  if (tavilyApiKey) swarm.tavily_api_key = tavilyApiKey;
  const exaApiKey = form.swarm_exa_api_key.trim();
  if (exaApiKey) swarm.exa_api_key = exaApiKey;
  const scrapingdogApiKey = form.swarm_scrapingdog_api_key.trim();
  if (scrapingdogApiKey) swarm.scrapingdog_api_key = scrapingdogApiKey;
  const memoryNamespace = form.swarm_memory_namespace?.trim();
  if (memoryNamespace && memoryNamespace !== "default") {
    swarm.cross_task_memory = {
      ...((swarm.cross_task_memory as Record<string, unknown>) ?? {}),
      namespace: memoryNamespace,
    };
  }
  const patternMemoryPath = form.swarm_pattern_memory_path?.trim();
  if (patternMemoryPath) swarm.pattern_memory_path = patternMemoryPath;
  if (form.swarm_force_rerun) swarm.force_rerun = true;
  if (form.swarm_auto_plan) swarm.auto_plan = true;

  return swarm;
}

function _buildRemoteApiSection(
  form: SettingsRef["form"],
): Record<string, string> | undefined {
  const provider = form.remote_api_provider;
  const apiKey = form.remote_api_key.trim();
  const baseUrl = form.remote_api_base_url.trim();

  const openaiCompatibleProviders: Record<string, true> = {
    openai_compatible: true,
    gemini: true,
    groq: true,
    cerebras: true,
    openrouter: true,
    deepseek: true,
    ollama_cloud: true,
  };

  if (provider === "anthropic") {
    if (!apiKey && !baseUrl) return undefined;
    const remoteApi: Record<string, string> = { provider };
    if (apiKey) remoteApi.api_key = apiKey;
    if (baseUrl) remoteApi.base_url = baseUrl;
    return remoteApi;
  }

  if (openaiCompatibleProviders[provider]) {
    const remoteApi: Record<string, string> = { provider };
    if (apiKey) remoteApi.api_key = apiKey;
    if (baseUrl) remoteApi.base_url = baseUrl;
    return remoteApi;
  }

  return undefined;
}

function _buildMcpSection(
  form: SettingsRef["form"],
  t: ReturnType<typeof useI18n>["t"],
): Record<string, unknown> | null | undefined {
  const mcpRaw = form.mcp_servers_json.trim();
  if (!mcpRaw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(mcpRaw);
  } catch (error) {
    errorMessage.value = t("errors.invalidMcpJson", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null; // null signals validation failure
  }

  const normalized = normalizeMcpConfig(parsed);
  if (!normalized) {
    errorMessage.value = t("errors.invalidMcpShape");
    return null;
  }
  return normalized;
}

function _buildCustomRolesSection(
  customRolesState: SettingsRef["customRolesState"],
  skillsState: SettingsRef["skillsState"],
): { customRoles?: Record<string, unknown>; skills?: Record<string, unknown> } {
  const result: {
    customRoles?: Record<string, unknown>;
    skills?: Record<string, unknown>;
  } = {};

  const customRolesArray = customRolesState.collectSnap();
  if (customRolesArray.length) {
    const customRolesConfig: Record<string, unknown> = {};
    for (const role of customRolesArray) {
      if (!role.id || !/^[a-z][a-z0-9_]{0,63}$/.test(role.id)) continue;
      const roleEntry: Record<string, unknown> = {
        title: role.label || role.id,
        environment: role.environment || "ollama",
        model: role.model || "",
      };
      const promptText = (role.prompt_text ?? "").trim();
      const promptPath = (role.prompt_path ?? "").trim();
      if (promptText) roleEntry.prompt_text = promptText;
      else if (promptPath) roleEntry.prompt_path = promptPath;
      const skillIds = parseSkillIds(role.skill_ids ?? "");
      if (skillIds.length) roleEntry.skill_ids = skillIds;
      customRolesConfig[role.id] = roleEntry;
    }
    if (Object.keys(customRolesConfig).length) result.customRoles = customRolesConfig;
  }

  const skillsConfig = skillsState.collectForApi();
  if (Object.keys(skillsConfig).length) result.skills = skillsConfig;

  return result;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function buildAgentConfig(
  settings: SettingsRef,
): Record<string, unknown> | null {
  const { t } = useI18n();
  const {
    form,
    rolesState,
    devRolesState,
    customRolesState,
    skillsState,
    profilesState,
  } = settings;

  const profilesObject = _buildProfilesConfig(profilesState, t);
  if (profilesObject === null) return null; // validation error set by helper

  const config: Record<string, unknown> = {
    ..._buildRolesConfig(rolesState, devRolesState, form),
  };

  const swarmSection = _buildSwarmSection(form);
  if (Object.keys(swarmSection).length) config.swarm = swarmSection;

  const plannerModel = form.swarm_planner_model?.trim();
  if (plannerModel) {
    const plannerConfig: Record<string, string> = { model: plannerModel };
    const plannerProvider = form.swarm_planner_provider.trim();
    if (plannerProvider) plannerConfig.environment = plannerProvider;
    config.swarm_planner = plannerConfig;
  }

  const remoteApiSection = _buildRemoteApiSection(form);
  if (remoteApiSection) config.remote_api = remoteApiSection;

  const mcpSection = _buildMcpSection(form, t);
  if (mcpSection === null) return null; // validation error set by helper
  if (mcpSection !== undefined) config.mcp = mcpSection;

  if (Object.keys(profilesObject).length) config.remote_api_profiles = profilesObject;

  const { customRoles, skills } = _buildCustomRolesSection(
    customRolesState,
    skillsState,
  );
  if (customRoles) config.custom_roles = customRoles;
  if (skills) config.skills = skills;

  return config;
}

/** Typed SSE events extracted from `delta.content` JSON frames. */
export interface AutoApprovedEvent {
  kind: "auto_approved";
  step: string;
  rule?: string | null;
  audit?: Record<string, unknown> | null;
}

export type ChatStreamEvent = AutoApprovedEvent;

/** Parse a single SSE `delta.content` string for structured pipeline events.
 *
 * The backend occasionally emits JSON-encoded audit events (e.g. auto_approved)
 * as a single `delta.content` chunk — distinguishable from regular log text
 * because the first non-whitespace character is `{` and the parsed object has
 * a recognised `status` or `_event_type` discriminator.
 * Returns `null` when the chunk is plain text (the common case).
 */
function parseChatStreamEvent(content: string): ChatStreamEvent | null {
  const trimmed = content.trim();
  if (!trimmed || trimmed.charAt(0) !== "{") return null;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    const disc = (obj["status"] ?? obj["_event_type"]) as string | undefined;
    if (disc !== "auto_approved") return null;
    return {
      kind: "auto_approved",
      step: String(obj["step"] ?? ""),
      rule: (obj["rule"] as string | undefined) ?? null,
      audit: (obj["audit"] as Record<string, unknown> | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

export async function runSwarmChat(
  settings: SettingsRef,
  onTaskId: (taskId: string) => void,
  onDone: () => void,
  sendWsSubscribe: () => void,
  onEvent?: (event: ChatStreamEvent) => void,
): Promise<void> {
  const { t } = useI18n();
  const { form, pipelineState } = settings;
  const agentConfig = buildAgentConfig(settings);
  if (!agentConfig) return;

  const pipelineSteps = pipelineState.collectStepIds();
  if (!pipelineSteps.length) {
    errorMessage.value = t("errors.addPipelineStep");
    return;
  }
  if (!pipelineSteps.includes("clarify_input")) {
    pipelineSteps.unshift("clarify_input");
  }

  // Topology from UI drives stage grouping: if the user has NOT manually
  // regrouped steps, apply the topology preset (e.g. parallel → BA ∥ Arch).
  // If the user manually grouped steps, respect their choice.
  const topology = form.swarm_topology.trim();
  const manualStages = pipelineState.collectStages();
  const hasManualParallelStages = manualStages.some((stage) => stage.length > 1);
  let pipelineStages: string[][] = manualStages;
  if (!hasManualParallelStages && topology && topology in TOPOLOGY_PRESETS) {
    pipelineStages = deriveStagesForTopology(pipelineSteps, topology);
  }
  const hasParallelStages = pipelineStages.some((stage) => stage.length > 1);

  const workspaceRoot = form.workspace_root.trim();
  const projectContextFile = form.project_context_file.trim();

  const resp = await fetch(apiUrl("/v1/chat/completions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "swarm-local",
      stream: true,
      messages: [{ role: "user", content: form.prompt }],
      agent_config: agentConfig,
      pipeline_steps: pipelineSteps,
      ...(hasParallelStages ? { pipeline_stages: pipelineStages } : {}),
      workspace_root: workspaceRoot || null,
      project_context_file: projectContextFile || null,
      workspace_write: form.workspace_write,
    }),
  });

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`;
    try {
      const body = await resp.json();
      errMsg = body?.detail ?? body?.error ?? errMsg;
    } catch {
      // response body is not JSON — use status text
    }
    throw new Error(errMsg);
  }

  const taskId = resp.headers.get("x-task-id") ?? "";
  onTaskId(taskId);
  sendWsSubscribe();

  const reader = resp.body?.getReader();
  if (reader) {
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!onEvent || !value) continue;
      buffer += decoder.decode(value, { stream: true });
      // SSE framing: events are separated by blank lines; each event has one or
      // more `data: ...` lines we care about. Drain complete events from buffer.
      let sep = buffer.indexOf("\n\n");
      while (sep !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const chunk = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const content = chunk.choices?.[0]?.delta?.content ?? "";
            if (!content) continue;
            const evt = parseChatStreamEvent(content);
            if (evt) onEvent(evt);
          } catch {
            // Non-JSON data line — ignore silently.
          }
        }
        sep = buffer.indexOf("\n\n");
      }
    }
  }
  onDone();
}
