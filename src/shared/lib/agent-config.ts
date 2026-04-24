import { ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { parseSkillIds } from "@/shared/lib/skill-utils";
import { ROLES } from "@/shared/lib/pipeline-schema";
import {
  getGlobalAutomationSettings,
  getGlobalSearchKeys,
} from "@/shared/lib/global-search-keys";
import type {
  CustomRoleSnap,
  DevRoleSnap,
  SettingsSnap,
} from "@/shared/model/project-types";

export const agentConfigErrorMessage = ref<string | null>(null);

export type AgentConfigForm = Pick<
  SettingsSnap,
  | "human_manual_review"
  | "swarm_languages"
  | "swarm_topology"
  | "swarm_pattern_memory"
  | "swarm_pipeline_hooks_module"
  | "swarm_mcp_auto"
  | "swarm_skip_mcp_tools"
  | "swarm_doc_locale"
  | "swarm_documentation_sources"
  | "swarm_database_url"
  | "swarm_database_hint"
  | "swarm_database_readonly"
  | "swarm_disable_tree_sitter"
  | "mcp_servers_json"
  | "swarm_tavily_api_key"
  | "swarm_exa_api_key"
  | "swarm_scrapingdog_api_key"
  | "media_enabled"
  | "media_image_provider"
  | "media_image_model"
  | "media_image_api_key"
  | "media_audio_provider"
  | "media_audio_model"
  | "media_audio_api_key"
  | "media_audio_voice"
  | "media_budget_max_cost_usd"
  | "media_budget_max_attempts"
  | "media_license_policy"
  | "swarm_memory_namespace"
  | "swarm_pattern_memory_path"
  | "swarm_force_rerun"
  | "remote_api_provider"
  | "remote_api_key"
  | "remote_api_base_url"
  | "prompt"
  | "workspace_root"
  | "project_context_file"
  | "workspace_write"
>;

export interface ProfilesStateLike {
  getDuplicateIds(): string[];
  collectAsObject(): Record<string, unknown>;
}

export interface RolesStateLike {
  collectRoleApiConfig(roleId: string): Record<string, unknown>;
}

export interface DevRolesStateLike {
  collectForApi(): DevRoleSnap[];
}

export interface CustomRolesStateLike {
  collectSnap(): CustomRoleSnap[];
}

export interface SkillsStateLike {
  collectForApi(): Record<string, unknown>;
}

export interface AgentConfigSettings {
  form: AgentConfigForm;
  profilesState: ProfilesStateLike;
  rolesState: RolesStateLike;
  devRolesState: DevRolesStateLike;
  customRolesState: CustomRolesStateLike;
  skillsState: SkillsStateLike;
}

export interface PipelineStateLike {
  collectStepIds(): string[];
  collectStages(): string[][];
}

export interface RunSwarmChatSettings extends AgentConfigSettings {
  pipelineState: PipelineStateLike;
}

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
  if (!mcpServers || typeof mcpServers !== "object" || Array.isArray(mcpServers)) {
    return null;
  }
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
    if (Array.isArray(serverEntry.args) && serverEntry.args.length) {
      normalized.args = serverEntry.args;
    }
    if (serverEntry.cwd) normalized.cwd = serverEntry.cwd;
    if (serverEntry.env && typeof serverEntry.env === "object") {
      normalized.env = serverEntry.env;
    }
    servers.push(normalized);
  }
  if (!servers.length) return null;
  return { servers };
}

function buildProfilesConfig(
  profilesState: ProfilesStateLike,
  t: ReturnType<typeof useI18n>["t"],
): Record<string, unknown> | null {
  const duplicateIds = profilesState.getDuplicateIds();
  if (duplicateIds.length) {
    agentConfigErrorMessage.value = t("errors.duplicateProfileId", {
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
    agentConfigErrorMessage.value = t("errors.invalidProfileId", {
      ids: invalidIds.join(", "),
    });
    return null;
  }
  return profilesObject;
}

function buildRolesConfig(
  rolesState: RolesStateLike,
  devRolesState: DevRolesStateLike,
  form: AgentConfigForm,
): Record<string, unknown> {
  const config: Record<string, unknown> = Object.fromEntries(
    ROLES.map((roleId) => [roleId, rolesState.collectRoleApiConfig(roleId)]),
  );
  const devRolesArray = devRolesState.collectForApi();
  if (devRolesArray.length) config.dev_roles = devRolesArray;
  if (form.human_manual_review) {
    config.human = { require_manual: true, auto_approve: false };
  }
  return config;
}

function buildSwarmSection(form: AgentConfigForm): Record<string, unknown> {
  const swarm: Record<string, unknown> = {};
  const languagesRaw = form.swarm_languages.trim();
  if (languagesRaw) {
    swarm.languages = languagesRaw
      .split(/[\s,]+/)
      .map((value) => value.trim().toLowerCase())
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

  // Automation & Quality — sourced from global user settings (server merges
  // these into the final config as well, so this is just a client-side echo).
  const automation = getGlobalAutomationSettings();
  if (automation.swarm_self_verify) swarm.self_verify = true;
  const selfVerifyProvider = automation.swarm_self_verify_provider.trim();
  if (selfVerifyProvider) swarm.self_verify_provider = selfVerifyProvider;
  const selfVerifyModel = automation.swarm_self_verify_model.trim();
  if (selfVerifyModel) swarm.self_verify_model = selfVerifyModel;
  const autoApproveValue = automation.swarm_auto_approve.trim();
  if (autoApproveValue) swarm.auto_approve = autoApproveValue;
  const autoApproveTimeout = parseInt(automation.swarm_auto_approve_timeout.trim(), 10);
  if (!isNaN(autoApproveTimeout) && autoApproveTimeout > 0) {
    swarm.auto_approve_timeout = autoApproveTimeout;
  }
  if (automation.swarm_auto_retry) swarm.auto_retry = true;
  const maxStepRetries = parseInt(automation.swarm_max_step_retries.trim(), 10);
  if (!isNaN(maxStepRetries) && maxStepRetries > 0) {
    swarm.max_step_retries = maxStepRetries;
  }
  if (automation.swarm_deep_planning) swarm.deep_planning = true;
  const deepPlanningProvider = automation.swarm_deep_planning_provider.trim();
  if (deepPlanningProvider) swarm.deep_planning_provider = deepPlanningProvider;
  const deepPlanningModel = automation.swarm_deep_planning_model.trim();
  if (deepPlanningModel) swarm.deep_planning_model = deepPlanningModel;
  if (automation.swarm_background_agent) swarm.background_agent = true;
  const backgroundAgentProvider = automation.swarm_background_agent_provider.trim();
  if (backgroundAgentProvider) {
    swarm.background_agent_provider = backgroundAgentProvider;
  }
  const backgroundAgentModel = automation.swarm_background_agent_model.trim();
  if (backgroundAgentModel) swarm.background_agent_model = backgroundAgentModel;
  const backgroundWatchPaths = automation.swarm_background_watch_paths.trim();
  if (backgroundWatchPaths) swarm.background_watch_paths = backgroundWatchPaths;
  if (automation.swarm_dream_enabled) swarm.dream_enabled = true;
  if (automation.swarm_quality_gate) swarm.quality_gate_enabled = true;
  const globalKeys = getGlobalSearchKeys();
  const tavilyApiKey = globalKeys.tavily || form.swarm_tavily_api_key?.trim() || "";
  if (tavilyApiKey) swarm.tavily_api_key = tavilyApiKey;
  const exaApiKey = globalKeys.exa || form.swarm_exa_api_key?.trim() || "";
  if (exaApiKey) swarm.exa_api_key = exaApiKey;
  const scrapingdogApiKey =
    globalKeys.scrapingdog || form.swarm_scrapingdog_api_key?.trim() || "";
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
  if (automation.swarm_auto_plan) swarm.auto_plan = true;
  return swarm;
}

function buildMediaSection(form: AgentConfigForm): Record<string, unknown> | undefined {
  if (!form.media_enabled) return undefined;
  const image: Record<string, string> = {};
  const imageProvider = form.media_image_provider?.trim() || "";
  if (imageProvider) image.provider = imageProvider;
  const imageModel = form.media_image_model?.trim() || "";
  if (imageModel) image.model = imageModel;
  const imageApiKey = form.media_image_api_key?.trim() || "";
  if (imageApiKey) image.api_key = imageApiKey;

  const audio: Record<string, string> = {};
  const audioProvider = form.media_audio_provider?.trim() || "";
  if (audioProvider) audio.provider = audioProvider;
  const audioModel = form.media_audio_model?.trim() || "";
  if (audioModel) audio.model = audioModel;
  const audioApiKey = form.media_audio_api_key?.trim() || "";
  if (audioApiKey) audio.api_key = audioApiKey;
  const audioVoice = form.media_audio_voice?.trim() || "";
  if (audioVoice) audio.voice = audioVoice;

  const budget: Record<string, number> = {};
  const maxCost = parseFloat(form.media_budget_max_cost_usd?.trim() || "");
  if (!isNaN(maxCost) && maxCost > 0) budget.max_cost_usd_per_task = maxCost;
  const maxAttempts = parseInt(form.media_budget_max_attempts?.trim() || "", 10);
  if (!isNaN(maxAttempts) && maxAttempts > 0) {
    budget.max_attempts_per_asset = maxAttempts;
  }

  const media: Record<string, unknown> = { enabled: true };
  if (Object.keys(image).length) media.image = image;
  if (Object.keys(audio).length) media.audio = audio;
  if (Object.keys(budget).length) media.budget = budget;
  const licensePolicy = form.media_license_policy?.trim() || "";
  if (licensePolicy) media.license_policy = licensePolicy;
  return media;
}

function buildRemoteApiSection(
  form: AgentConfigForm,
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

function buildMcpSection(
  form: AgentConfigForm,
  t: ReturnType<typeof useI18n>["t"],
): Record<string, unknown> | null | undefined {
  const mcpRaw = form.mcp_servers_json.trim();
  if (!mcpRaw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(mcpRaw);
  } catch (error) {
    agentConfigErrorMessage.value = t("errors.invalidMcpJson", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  const normalized = normalizeMcpConfig(parsed);
  if (!normalized) {
    agentConfigErrorMessage.value = t("errors.invalidMcpShape");
    return null;
  }
  return normalized;
}

function buildCustomRolesSection(
  customRolesState: CustomRolesStateLike,
  skillsState: SkillsStateLike,
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
    if (Object.keys(customRolesConfig).length) {
      result.customRoles = customRolesConfig;
    }
  }

  const skillsConfig = skillsState.collectForApi();
  if (Object.keys(skillsConfig).length) result.skills = skillsConfig;
  return result;
}

export function buildAgentConfig(
  settings: AgentConfigSettings,
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

  const profilesObject = buildProfilesConfig(profilesState, t);
  if (profilesObject === null) return null;

  const config: Record<string, unknown> = {
    ...buildRolesConfig(rolesState, devRolesState, form),
  };

  const swarmSection = buildSwarmSection(form);
  if (Object.keys(swarmSection).length) config.swarm = swarmSection;

  const mediaSection = buildMediaSection(form);
  if (mediaSection) config.media = mediaSection;

  const automationForPlanner = getGlobalAutomationSettings();
  const plannerModel = automationForPlanner.swarm_planner_model.trim();
  if (plannerModel) {
    const plannerConfig: Record<string, string> = { model: plannerModel };
    const plannerProvider = automationForPlanner.swarm_planner_provider.trim();
    if (plannerProvider) plannerConfig.environment = plannerProvider;
    config.swarm_planner = plannerConfig;
  }

  const remoteApiSection = buildRemoteApiSection(form);
  if (remoteApiSection) config.remote_api = remoteApiSection;

  const mcpSection = buildMcpSection(form, t);
  if (mcpSection === null) return null;
  if (mcpSection !== undefined) config.mcp = mcpSection;

  if (Object.keys(profilesObject).length) config.remote_api_profiles = profilesObject;

  const { customRoles, skills } = buildCustomRolesSection(
    customRolesState,
    skillsState,
  );
  if (customRoles) config.custom_roles = customRoles;
  if (skills) config.skills = skills;

  return config;
}
