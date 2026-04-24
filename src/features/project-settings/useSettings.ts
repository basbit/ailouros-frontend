import { ref, reactive } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import type { SettingsSnap } from "@/shared/store/projects";
import { useAgentRoles } from "@/features/agent-roles/useAgentRoles";
import { useRemoteApiProfiles } from "@/features/remote-api/useRemoteApiProfiles";
import { usePipeline } from "@/features/pipeline/usePipeline";
import { useCustomRoles } from "@/features/custom-roles/useCustomRoles";
import { useDevRoles } from "@/features/dev-roles/useDevRoles";
import { useSkillsCatalog } from "@/features/skills-catalog/useSkillsCatalog";
import { useProjectLifecycle } from "@/features/project-settings/useProjectLifecycle";
import {
  loadProjectSettings,
  saveProjectSettings,
} from "@/shared/api/endpoints/project-settings";
import {
  defaultRemoteApiBaseUrl,
  defaultRemoteApiProvider,
} from "@/shared/lib/use-swarm-defaults";
import { LS_GLOBAL_SEARCH_KEYS } from "@/shared/lib/swarm-ui-constants";

export function useSettings() {
  const projectsStore = useProjectsStore();

  // ── Form state ─────────────────────────────────────────────────────────────
  const form = reactive({
    // Workspace
    prompt: "",
    workspace_root: "",
    project_context_file: "",
    workspace_write: true,
    human_manual_review: false,
    swarm_languages: "",
    swarm_topology: "",
    swarm_pattern_memory: false,
    swarm_pipeline_hooks_module: "",
    swarm_mcp_auto: true,
    swarm_skip_mcp_tools: false,
    swarm_doc_locale: "",
    swarm_documentation_sources: "",
    swarm_database_url: "",
    swarm_database_hint: "",
    swarm_database_readonly: true,
    swarm_disable_tree_sitter: false,
    mcp_servers_json: "",
    swarm_tavily_api_key: "",
    swarm_exa_api_key: "",
    swarm_scrapingdog_api_key: "",
    // Media generation (§26)
    media_enabled: false,
    media_image_provider: "",
    media_image_model: "",
    media_image_api_key: "",
    media_audio_provider: "",
    media_audio_model: "",
    media_audio_api_key: "",
    media_audio_voice: "",
    media_budget_max_cost_usd: "",
    media_budget_max_attempts: "",
    media_license_policy: "permissive_only",
    // Project-scoped memory + per-run flag (Automation & Quality lives in global settings now).
    swarm_memory_namespace: "",
    swarm_pattern_memory_path: "",
    swarm_force_rerun: false,
    // Remote API (legacy single-provider fields kept for snap compatibility)
    remote_api_provider: defaultRemoteApiProvider(),
    remote_api_key: "",
    remote_api_base_url: "",
  });

  let _saveTimer: ReturnType<typeof setTimeout> | null = null;
  const isBooting = ref(true);

  // ── Sub-feature composables ────────────────────────────────────────────────

  const profilesState = useRemoteApiProfiles(() => saveSettingsSoon());
  const rolesState = useAgentRoles(profilesState.profiles, () => saveSettingsSoon());
  const customRolesState = useCustomRoles(() => saveSettingsSoon());
  const pipelineState = usePipeline(customRolesState.customRoles, () =>
    saveSettingsSoon(),
  );
  const devRolesState = useDevRoles(() => saveSettingsSoon());
  const skillsState = useSkillsCatalog(() => saveSettingsSoon());

  // ── Persistence ────────────────────────────────────────────────────────────

  function saveSettingsSoon(): void {
    if (isBooting.value) return;
    if (_saveTimer !== null) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      void persistSettings();
    }, 400);
  }

  function flushSave(): void {
    if (_saveTimer !== null) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    void persistSettings();
  }

  async function flushSaveAsync(): Promise<void> {
    if (_saveTimer !== null) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    await persistSettings();
  }

  async function persistSettings(): Promise<void> {
    const snap = collectSnap();
    try {
      projectsStore.saveSnap(snap);
    } catch {
      /* storage quota exceeded */
    }
    const workspaceRoot = snap.workspace_root.trim();
    if (!workspaceRoot) return;
    try {
      await saveProjectSettings(workspaceRoot, snap);
    } catch {
      /* invalid/incomplete workspace path while editing */
    }
  }

  function saveSettingsToStorage(): void {
    void persistSettings();
  }

  // ── Snapshot I/O ───────────────────────────────────────────────────────────

  function collectSnap(): SettingsSnap {
    return {
      v: 1,
      prompt: form.prompt,
      pipeline: pipelineState.collectSnap(),
      workspace_root: form.workspace_root,
      project_context_file: form.project_context_file,
      workspace_write: form.workspace_write,
      human_manual_review: form.human_manual_review,
      swarm_languages: form.swarm_languages,
      swarm_topology: form.swarm_topology,
      swarm_pattern_memory: form.swarm_pattern_memory,
      swarm_pipeline_hooks_module: form.swarm_pipeline_hooks_module,
      swarm_mcp_auto: form.swarm_mcp_auto,
      swarm_skip_mcp_tools: form.swarm_skip_mcp_tools,
      swarm_doc_locale: form.swarm_doc_locale,
      swarm_documentation_sources: form.swarm_documentation_sources,
      swarm_database_url: form.swarm_database_url,
      swarm_database_hint: form.swarm_database_hint,
      swarm_database_readonly: form.swarm_database_readonly,
      swarm_disable_tree_sitter: form.swarm_disable_tree_sitter,
      mcp_servers_json: form.mcp_servers_json,
      swarm_tavily_api_key: form.swarm_tavily_api_key,
      swarm_exa_api_key: form.swarm_exa_api_key,
      swarm_scrapingdog_api_key: form.swarm_scrapingdog_api_key,
      media_enabled: form.media_enabled,
      media_image_provider: form.media_image_provider,
      media_image_model: form.media_image_model,
      media_image_api_key: form.media_image_api_key,
      media_audio_provider: form.media_audio_provider,
      media_audio_model: form.media_audio_model,
      media_audio_api_key: form.media_audio_api_key,
      media_audio_voice: form.media_audio_voice,
      media_budget_max_cost_usd: form.media_budget_max_cost_usd,
      media_budget_max_attempts: form.media_budget_max_attempts,
      media_license_policy: form.media_license_policy,
      swarm_memory_namespace: form.swarm_memory_namespace,
      swarm_pattern_memory_path: form.swarm_pattern_memory_path,
      swarm_force_rerun: form.swarm_force_rerun,
      remote_api_provider: form.remote_api_provider,
      remote_api_key: form.remote_api_key,
      remote_api_base_url: form.remote_api_base_url,
      remote_api_profile_rows: profilesState.collectForSnap(),
      custom_roles: customRolesState.collectSnap(),
      dev_roles: devRolesState.collectSnap(),
      skills_catalog: skillsState.collectSnap(),
      roles: rolesState.collectRolesSnap(),
    };
  }

  async function applySnap(snap: SettingsSnap): Promise<void> {
    if (!snap || snap.v !== 1) return;
    form.prompt = snap.prompt ?? "";
    form.workspace_root = snap.workspace_root ?? "";
    form.project_context_file = snap.project_context_file ?? "";
    form.workspace_write = snap.workspace_write ?? true;
    form.human_manual_review = snap.human_manual_review ?? false;
    form.swarm_languages = snap.swarm_languages ?? "";
    form.swarm_topology = snap.swarm_topology ?? "";
    form.swarm_pattern_memory = snap.swarm_pattern_memory ?? false;
    form.swarm_pipeline_hooks_module = snap.swarm_pipeline_hooks_module ?? "";
    form.swarm_mcp_auto = snap.swarm_mcp_auto ?? true;
    form.swarm_skip_mcp_tools = snap.swarm_skip_mcp_tools ?? false;
    form.swarm_doc_locale = snap.swarm_doc_locale ?? "";
    form.swarm_documentation_sources = snap.swarm_documentation_sources ?? "";
    form.swarm_database_url = snap.swarm_database_url ?? "";
    form.swarm_database_hint = snap.swarm_database_hint ?? "";
    form.swarm_database_readonly = snap.swarm_database_readonly ?? true;
    form.swarm_disable_tree_sitter = snap.swarm_disable_tree_sitter ?? false;
    form.mcp_servers_json = snap.mcp_servers_json ?? "";
    form.swarm_tavily_api_key = snap.swarm_tavily_api_key ?? "";
    form.swarm_exa_api_key = snap.swarm_exa_api_key ?? "";
    form.swarm_scrapingdog_api_key = snap.swarm_scrapingdog_api_key ?? "";
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
    form.media_license_policy = snap.media_license_policy ?? "permissive_only";
    form.swarm_memory_namespace = snap.swarm_memory_namespace ?? "";
    form.swarm_pattern_memory_path = snap.swarm_pattern_memory_path ?? "";
    form.swarm_force_rerun = snap.swarm_force_rerun ?? false;
    form.remote_api_provider = snap.remote_api_provider ?? defaultRemoteApiProvider();
    form.remote_api_key = snap.remote_api_key ?? "";
    form.remote_api_base_url = snap.remote_api_base_url ?? "";

    if (
      Array.isArray(snap.remote_api_profile_rows) &&
      snap.remote_api_profile_rows.length
    ) {
      profilesState.applyFromArray(snap.remote_api_profile_rows);
    }

    applyRemoteProviderDefaultUrl();
    skillsState.applySnap(snap.skills_catalog ?? []);
    customRolesState.applySnap(snap.custom_roles ?? []);
    devRolesState.applySnap(snap.dev_roles ?? []);

    if (snap.pipeline && snap.pipeline.length) {
      pipelineState.applySnap(snap.pipeline);
    } else {
      pipelineState.reset();
    }

    await rolesState.applyRolesSnap(snap.roles ?? {});
  }

  function applyRemoteProviderDefaultUrl(): void {
    if (!form.remote_api_base_url.trim()) {
      const preset = defaultRemoteApiBaseUrl(form.remote_api_provider);
      if (preset !== undefined) form.remote_api_base_url = preset;
    }
  }

  async function loadProjectSnap(workspaceRoot: string): Promise<SettingsSnap | null> {
    const trimmed = workspaceRoot.trim();
    if (!trimmed) return null;
    try {
      return await loadProjectSettings(trimmed);
    } catch {
      return null;
    }
  }

  function loadLegacySearchKeys(): Partial<
    Pick<
      SettingsSnap,
      "swarm_tavily_api_key" | "swarm_exa_api_key" | "swarm_scrapingdog_api_key"
    >
  > {
    try {
      const raw = localStorage.getItem(LS_GLOBAL_SEARCH_KEYS);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as {
        tavily?: unknown;
        exa?: unknown;
        scrapingdog?: unknown;
      };
      return {
        swarm_tavily_api_key: String(parsed.tavily ?? "").trim(),
        swarm_exa_api_key: String(parsed.exa ?? "").trim(),
        swarm_scrapingdog_api_key: String(parsed.scrapingdog ?? "").trim(),
      };
    } catch {
      return {};
    }
  }

  // ── Project lifecycle (delegated) ─────────────────────────────────────────

  const lifecycle = useProjectLifecycle({
    isBooting,
    rolesIsBooting: rolesState.isBooting,
    applySnap,
    resetPipelineIfEmpty: () => {
      if (!pipelineState.steps.value.length) pipelineState.reset();
    },
    flushSave,
    flushSaveAsync,
    saveToStorage: saveSettingsToStorage,
    loadProjectSnap,
    loadGlobalProfiles: () => profilesState.loadGlobal(),
    loadLegacySearchKeys,
    applyDefaultProviderUrl: applyRemoteProviderDefaultUrl,
  });

  return {
    form,
    isBooting,
    profilesState,
    rolesState,
    customRolesState,
    pipelineState,
    devRolesState,
    skillsState,
    collectSnap,
    saveSettingsSoon,
    flushSave,
    flushSaveAsync,
    applySnap,
    applyRemoteProviderDefaultUrl,
    ...lifecycle,
  };
}
