import { reactive } from "vue";
import type { SettingsSnap } from "@/entities/project";
import {
  defaultRemoteApiBaseUrl,
  defaultRemoteApiProvider,
} from "@/shared/lib/use-swarm-defaults";
import { baseSettingsDefaults } from "@/shared/store/projects";

const DEFAULT_LICENSE_POLICY = "permissive_only";
const DEFAULT_READY_PATH = "/";
const DEFAULT_VISUAL_PAGES = "/";
const DEFAULT_MAX_REVIEW_IMAGES = "4";

interface LegacyVisualFields {
  swarm_visual_start_cwd?: string;
}

interface PersistedScenarioOverride {
  skip_gates?: string[];
  model_profile?: Record<string, string>;
}

interface PersistedCustomScenario {
  id: string;
  title: string;
  pipeline_steps: string[];
  workspace_write_default: boolean;
}

export type SettingsForm = ReturnType<typeof createSettingsForm>;

export function createSettingsForm() {
  return reactive({
    ...baseSettingsDefaults(),
    custom_scenarios: [] as PersistedCustomScenario[],
    favorite_scenarios: [] as string[],
    scenario_overrides: {} as Record<string, PersistedScenarioOverride>,
  });
}

function copyTextFields(form: SettingsForm, snap: SettingsSnap): void {
  form.prompt = snap.prompt ?? "";
  form.workspace_root = snap.workspace_root ?? "";
  form.project_context_file = snap.project_context_file ?? "";
  form.swarm_languages = snap.swarm_languages ?? "";
  form.swarm_topology = snap.swarm_topology ?? "";
  form.swarm_pipeline_hooks_module = snap.swarm_pipeline_hooks_module ?? "";
  form.swarm_doc_locale = snap.swarm_doc_locale ?? "";
  form.swarm_documentation_sources = snap.swarm_documentation_sources ?? "";
  form.swarm_database_url = snap.swarm_database_url ?? "";
  form.swarm_database_hint = snap.swarm_database_hint ?? "";
  form.mcp_servers_json = snap.mcp_servers_json ?? "";
  form.swarm_tavily_api_key = snap.swarm_tavily_api_key ?? "";
  form.swarm_exa_api_key = snap.swarm_exa_api_key ?? "";
  form.swarm_scrapingdog_api_key = snap.swarm_scrapingdog_api_key ?? "";
  form.swarm_memory_namespace = snap.swarm_memory_namespace ?? "";
  form.swarm_pattern_memory_path = snap.swarm_pattern_memory_path ?? "";
}

function copyToggleFields(form: SettingsForm, snap: SettingsSnap): void {
  form.workspace_write = snap.workspace_write ?? true;
  form.human_manual_review = snap.human_manual_review ?? false;
  form.swarm_pattern_memory = snap.swarm_pattern_memory ?? false;
  form.swarm_mcp_auto = snap.swarm_mcp_auto ?? true;
  form.swarm_skip_mcp_tools = snap.swarm_skip_mcp_tools ?? false;
  form.swarm_database_readonly = snap.swarm_database_readonly ?? true;
  form.swarm_disable_tree_sitter = snap.swarm_disable_tree_sitter ?? false;
  form.swarm_force_rerun = snap.swarm_force_rerun ?? false;
}

function copyVisualProbeFields(form: SettingsForm, snap: SettingsSnap): void {
  const legacy = snap as SettingsSnap & LegacyVisualFields;
  form.swarm_visual_probe_enabled = snap.swarm_visual_probe_enabled ?? true;
  form.swarm_visual_base_url = snap.swarm_visual_base_url ?? "";
  form.swarm_visual_start_command = snap.swarm_visual_start_command ?? "";
  form.swarm_visual_start_directory =
    snap.swarm_visual_start_directory ?? legacy.swarm_visual_start_cwd ?? "";
  form.swarm_visual_ready_path = snap.swarm_visual_ready_path ?? DEFAULT_READY_PATH;
  form.swarm_visual_pages = snap.swarm_visual_pages ?? DEFAULT_VISUAL_PAGES;
  form.swarm_visual_capture_har = snap.swarm_visual_capture_har ?? false;
  form.swarm_visual_capture_trace = snap.swarm_visual_capture_trace ?? false;
  form.swarm_visual_multimodal_review = snap.swarm_visual_multimodal_review ?? false;
  form.swarm_visual_max_review_images =
    snap.swarm_visual_max_review_images ?? DEFAULT_MAX_REVIEW_IMAGES;
}

function copyMediaFields(form: SettingsForm, snap: SettingsSnap): void {
  form.media_enabled = snap.media_enabled ?? false;
  form.media_image_provider = snap.media_image_provider ?? "";
  form.media_image_model = snap.media_image_model ?? "";
  form.media_image_api_key = snap.media_image_api_key ?? "";
  form.media_audio_provider = snap.media_audio_provider ?? "";
  form.media_audio_model = snap.media_audio_model ?? "";
  form.media_audio_api_key = snap.media_audio_api_key ?? "";
  form.media_audio_voice = snap.media_audio_voice ?? "";
  form.media_budget_max_cost_usd = snap.media_budget_max_cost_usd ?? "";
  form.media_budget_max_attempts = snap.media_budget_max_attempts ?? "";
  form.media_license_policy = snap.media_license_policy ?? DEFAULT_LICENSE_POLICY;
}

function normalizeCustomScenarios(raw: unknown): PersistedCustomScenario[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is PersistedCustomScenario =>
        Boolean(item) &&
        typeof (item as PersistedCustomScenario).id === "string" &&
        typeof (item as PersistedCustomScenario).title === "string" &&
        Array.isArray((item as PersistedCustomScenario).pipeline_steps),
    )
    .map((item) => ({
      id: item.id,
      title: item.title,
      pipeline_steps: item.pipeline_steps.map((step) => String(step)),
      workspace_write_default: Boolean(item.workspace_write_default),
    }));
}

function copyScenarioFields(form: SettingsForm, snap: SettingsSnap): void {
  form.scenario_id = snap.scenario_id ?? null;
  form.custom_scenario_id = snap.custom_scenario_id ?? null;
  form.custom_scenarios = normalizeCustomScenarios(snap.custom_scenarios);
  form.favorite_scenarios = Array.isArray(snap.favorite_scenarios)
    ? [...snap.favorite_scenarios]
    : [];
  const overridesRaw = snap.scenario_overrides;
  form.scenario_overrides =
    overridesRaw && typeof overridesRaw === "object"
      ? (JSON.parse(JSON.stringify(overridesRaw)) as Record<
          string,
          PersistedScenarioOverride
        >)
      : {};
}

function copyRemoteApiFields(form: SettingsForm, snap: SettingsSnap): void {
  form.remote_api_provider = snap.remote_api_provider ?? defaultRemoteApiProvider();
  form.remote_api_key = snap.remote_api_key ?? "";
  form.remote_api_base_url = snap.remote_api_base_url ?? "";
}

export function applyFormFromSnap(form: SettingsForm, snap: SettingsSnap): void {
  copyTextFields(form, snap);
  copyToggleFields(form, snap);
  copyVisualProbeFields(form, snap);
  copyMediaFields(form, snap);
  copyScenarioFields(form, snap);
  copyRemoteApiFields(form, snap);
}

export function applyRemoteProviderDefaultUrl(form: SettingsForm): void {
  if (form.remote_api_base_url.trim()) return;
  const preset = defaultRemoteApiBaseUrl(form.remote_api_provider);
  if (preset !== undefined) form.remote_api_base_url = preset;
}
