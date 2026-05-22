import {
  getGlobalAutomationSettings,
  getGlobalSearchKeys,
} from "@/shared/lib/global-search-keys";
import type { AgentConfigForm } from "@/shared/lib/agent-config-types";
import { parseDocumentationSourceLines } from "@/shared/lib/agent-config-sections/documentation-sources";
import { buildVisualProbeConfig } from "@/shared/lib/agent-config-sections/visual-probe";

type AutomationSettings = ReturnType<typeof getGlobalAutomationSettings>;

const DEFAULT_MEMORY_NAMESPACE = "default";
const LANGUAGE_SEPARATOR_PATTERN = /[\s,]+/;

function parseLanguageList(raw: string): string[] {
  return raw
    .split(LANGUAGE_SEPARATOR_PATTERN)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function applySwarmLanguageList(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const languagesRaw = form.swarm_languages.trim();
  if (!languagesRaw) return;
  const languages = parseLanguageList(languagesRaw);
  if (languages.length) target.languages = languages;
}

function applySwarmTopologyAndHooks(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const topology = form.swarm_topology.trim();
  if (topology) target.topology = topology;
  if (form.swarm_pattern_memory) target.pattern_memory = true;
  const pipelineHooksModule = form.swarm_pipeline_hooks_module.trim();
  if (pipelineHooksModule) target.pipeline_hooks_module = pipelineHooksModule;
}

function applySwarmMcpFlags(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  if (!form.swarm_mcp_auto) target.mcp_auto = false;
  if (form.swarm_skip_mcp_tools) target.skip_mcp_tools = true;
}

function applySwarmDocumentationFields(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const documentationLocale = form.swarm_doc_locale.trim();
  if (documentationLocale) target.documentation_locale = documentationLocale;
  const documentationText = form.swarm_documentation_sources.trim();
  if (!documentationText) return;
  const sources = parseDocumentationSourceLines(documentationText);
  if (sources.length) target.documentation_sources = sources;
}

function applySwarmDatabaseFields(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const databaseUrl = form.swarm_database_url.trim();
  if (databaseUrl) target.database_url = databaseUrl;
  const databaseHint = form.swarm_database_hint.trim();
  if (databaseHint) target.database_hint = databaseHint;
  if (!form.swarm_database_readonly) target.database_readonly = false;
  if (form.swarm_disable_tree_sitter) target.disable_tree_sitter = true;
}

function applySwarmVisualProbe(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const visualProbe = buildVisualProbeConfig(form);
  if (Object.keys(visualProbe).length) target.visual_probe = visualProbe;
}

function applySelfVerifyAutomation(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  if (automation.swarm_self_verify) target.self_verify = true;
  const provider = automation.swarm_self_verify_provider.trim();
  if (provider) target.self_verify_provider = provider;
  const model = automation.swarm_self_verify_model.trim();
  if (model) target.self_verify_model = model;
}

function applyAutoApproveAutomation(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  const autoApproveValue = automation.swarm_auto_approve.trim();
  if (autoApproveValue) target.auto_approve = autoApproveValue;
  const timeout = parseInt(automation.swarm_auto_approve_timeout.trim(), 10);
  if (!isNaN(timeout) && timeout > 0) target.auto_approve_timeout = timeout;
}

function applyAutoRetryAutomation(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  if (automation.swarm_auto_retry) target.auto_retry = true;
  const maxRetries = parseInt(automation.swarm_max_step_retries.trim(), 10);
  if (!isNaN(maxRetries) && maxRetries > 0) target.max_step_retries = maxRetries;
}

function applyDeepPlanningAutomation(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  if (automation.swarm_deep_planning) target.deep_planning = true;
  const provider = automation.swarm_deep_planning_provider.trim();
  if (provider) target.deep_planning_provider = provider;
  const model = automation.swarm_deep_planning_model.trim();
  if (model) target.deep_planning_model = model;
}

function applyBackgroundAgentAutomation(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  if (automation.swarm_background_agent) target.background_agent = true;
  const provider = automation.swarm_background_agent_provider.trim();
  if (provider) target.background_agent_provider = provider;
  const model = automation.swarm_background_agent_model.trim();
  if (model) target.background_agent_model = model;
  const watchPaths = automation.swarm_background_watch_paths.trim();
  if (watchPaths) target.background_watch_paths = watchPaths;
}

function applyAutomationFlags(
  target: Record<string, unknown>,
  automation: AutomationSettings,
): void {
  if (automation.swarm_dream_enabled) target.dream_enabled = true;
  if (automation.swarm_quality_gate) target.quality_gate_enabled = true;
  if (automation.swarm_auto_plan) target.auto_plan = true;
}

function applySwarmAutomation(target: Record<string, unknown>): void {
  const automation = getGlobalAutomationSettings();
  applySelfVerifyAutomation(target, automation);
  applyAutoApproveAutomation(target, automation);
  applyAutoRetryAutomation(target, automation);
  applyDeepPlanningAutomation(target, automation);
  applyBackgroundAgentAutomation(target, automation);
  applyAutomationFlags(target, automation);
}

function resolveSearchApiKey(globalKey: string, formKey: string | undefined): string {
  if (globalKey) return globalKey;
  return formKey?.trim() ?? "";
}

function applySwarmSearchApiKeys(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const globalKeys = getGlobalSearchKeys();
  const tavily = resolveSearchApiKey(globalKeys.tavily, form.swarm_tavily_api_key);
  if (tavily) target.tavily_api_key = tavily;
  const exa = resolveSearchApiKey(globalKeys.exa, form.swarm_exa_api_key);
  if (exa) target.exa_api_key = exa;
  const scrapingdog = resolveSearchApiKey(
    globalKeys.scrapingdog,
    form.swarm_scrapingdog_api_key,
  );
  if (scrapingdog) target.scrapingdog_api_key = scrapingdog;
}

function applySwarmMemoryFields(
  target: Record<string, unknown>,
  form: AgentConfigForm,
): void {
  const memoryNamespace = form.swarm_memory_namespace?.trim() ?? "";
  if (memoryNamespace && memoryNamespace !== DEFAULT_MEMORY_NAMESPACE) {
    const existingCrossTaskMemory =
      typeof target.cross_task_memory === "object" && target.cross_task_memory !== null
        ? (target.cross_task_memory as Record<string, unknown>)
        : {};
    target.cross_task_memory = {
      ...existingCrossTaskMemory,
      namespace: memoryNamespace,
    };
  }
  const patternMemoryPath = form.swarm_pattern_memory_path?.trim() ?? "";
  if (patternMemoryPath) target.pattern_memory_path = patternMemoryPath;
  if (form.swarm_force_rerun) target.force_rerun = true;
}

export function buildSwarmSection(form: AgentConfigForm): Record<string, unknown> {
  const swarm: Record<string, unknown> = {};
  applySwarmLanguageList(swarm, form);
  applySwarmTopologyAndHooks(swarm, form);
  applySwarmMcpFlags(swarm, form);
  applySwarmDocumentationFields(swarm, form);
  applySwarmDatabaseFields(swarm, form);
  applySwarmVisualProbe(swarm, form);
  applySwarmAutomation(swarm);
  applySwarmSearchApiKeys(swarm, form);
  applySwarmMemoryFields(swarm, form);
  return swarm;
}
