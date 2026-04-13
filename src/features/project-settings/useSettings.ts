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
  defaultRemoteApiBaseUrl,
  defaultRemoteApiProvider,
  defaultSwarmProvider,
} from "@/shared/lib/use-swarm-defaults";

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
    // Automation & Quality
    swarm_self_verify: false,
    swarm_self_verify_model: "",
    swarm_auto_approve: "",
    swarm_auto_approve_timeout: "",
    swarm_auto_retry: false,
    swarm_max_step_retries: "",
    swarm_deep_planning: false,
    swarm_deep_planning_model: "",
    swarm_background_agent: false,
    swarm_background_watch_paths: "",
    swarm_dream_enabled: false,
    swarm_quality_gate: false,
    swarm_auto_plan: false,
    swarm_planner_model: "",
    swarm_memory_namespace: "",
    swarm_pattern_memory_path: "",
    swarm_force_rerun: false,
    swarm_self_verify_provider: defaultSwarmProvider(),
    swarm_deep_planning_provider: defaultSwarmProvider(),
    swarm_planner_provider: defaultSwarmProvider(),
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
      saveSettingsToStorage();
    }, 400);
  }

  function flushSave(): void {
    if (_saveTimer !== null) {
      clearTimeout(_saveTimer);
      _saveTimer = null;
    }
    saveSettingsToStorage();
  }

  function saveSettingsToStorage(): void {
    try {
      projectsStore.saveSnap(collectSnap());
    } catch {
      /* storage quota exceeded */
    }
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
      swarm_self_verify: form.swarm_self_verify,
      swarm_self_verify_model: form.swarm_self_verify_model,
      swarm_auto_approve: form.swarm_auto_approve,
      swarm_auto_approve_timeout: form.swarm_auto_approve_timeout,
      swarm_auto_retry: form.swarm_auto_retry,
      swarm_max_step_retries: form.swarm_max_step_retries,
      swarm_deep_planning: form.swarm_deep_planning,
      swarm_deep_planning_model: form.swarm_deep_planning_model,
      swarm_background_agent: form.swarm_background_agent,
      swarm_background_watch_paths: form.swarm_background_watch_paths,
      swarm_dream_enabled: form.swarm_dream_enabled,
      swarm_quality_gate: form.swarm_quality_gate,
      swarm_auto_plan: form.swarm_auto_plan,
      swarm_planner_model: form.swarm_planner_model,
      swarm_memory_namespace: form.swarm_memory_namespace,
      swarm_pattern_memory_path: form.swarm_pattern_memory_path,
      swarm_force_rerun: form.swarm_force_rerun,
      swarm_self_verify_provider: form.swarm_self_verify_provider,
      swarm_deep_planning_provider: form.swarm_deep_planning_provider,
      swarm_planner_provider: form.swarm_planner_provider,
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
    form.swarm_self_verify = snap.swarm_self_verify ?? false;
    form.swarm_self_verify_model = snap.swarm_self_verify_model ?? "";
    form.swarm_auto_approve = snap.swarm_auto_approve ?? "";
    form.swarm_auto_approve_timeout = snap.swarm_auto_approve_timeout ?? "";
    form.swarm_auto_retry = snap.swarm_auto_retry ?? false;
    form.swarm_max_step_retries = snap.swarm_max_step_retries ?? "";
    form.swarm_deep_planning = snap.swarm_deep_planning ?? false;
    form.swarm_deep_planning_model = snap.swarm_deep_planning_model ?? "";
    form.swarm_background_agent = snap.swarm_background_agent ?? false;
    form.swarm_background_watch_paths = snap.swarm_background_watch_paths ?? "";
    form.swarm_dream_enabled = snap.swarm_dream_enabled ?? false;
    form.swarm_quality_gate = snap.swarm_quality_gate ?? false;
    form.swarm_auto_plan = snap.swarm_auto_plan ?? false;
    form.swarm_planner_model = snap.swarm_planner_model ?? "";
    form.swarm_memory_namespace = snap.swarm_memory_namespace ?? "";
    form.swarm_pattern_memory_path = snap.swarm_pattern_memory_path ?? "";
    form.swarm_force_rerun = snap.swarm_force_rerun ?? false;
    form.swarm_self_verify_provider =
      snap.swarm_self_verify_provider ?? defaultSwarmProvider();
    form.swarm_deep_planning_provider =
      snap.swarm_deep_planning_provider ?? defaultSwarmProvider();
    form.swarm_planner_provider = snap.swarm_planner_provider ?? defaultSwarmProvider();
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

  // ── Project lifecycle (delegated) ─────────────────────────────────────────

  const lifecycle = useProjectLifecycle({
    isBooting,
    rolesIsBooting: rolesState.isBooting,
    applySnap,
    resetPipelineIfEmpty: () => {
      if (!pipelineState.steps.value.length) pipelineState.reset();
    },
    flushSave,
    saveToStorage: saveSettingsToStorage,
    loadGlobalProfiles: () => profilesState.loadGlobal(),
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
    applySnap,
    applyRemoteProviderDefaultUrl,
    ...lifecycle,
  };
}
