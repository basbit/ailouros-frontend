import { ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import type { SettingsSnap } from "@/entities/project";
import { useAgentRoles } from "@/features/agent-roles/useAgentRoles";
import { useRemoteApiProfiles } from "@/features/remote-api/useRemoteApiProfiles";
import { usePipeline } from "@/features/pipeline/usePipeline";
import { useCustomRoles } from "@/features/custom-roles/useCustomRoles";
import { useDevRoles } from "@/features/dev-roles/useDevRoles";
import { useSkillsCatalog } from "@/features/skills-catalog/useSkillsCatalog";
import { useProjectLifecycle } from "@/features/project-settings/useProjectLifecycle";
import {
  createSettingsForm,
  applyFormFromSnap,
  applyRemoteProviderDefaultUrl as applyRemoteProviderDefaultUrlOn,
} from "./useSettingsForm";
import { useSettingsPersistence } from "./useSettingsPersistence";

export function useSettings() {
  const projectsStore = useProjectsStore();
  const form = createSettingsForm();
  const isBooting = ref(true);

  const profilesState = useRemoteApiProfiles(() => saveSettingsSoon());
  const rolesState = useAgentRoles(profilesState.profiles, () => saveSettingsSoon());
  const customRolesState = useCustomRoles(() => saveSettingsSoon());
  const pipelineState = usePipeline(customRolesState.customRoles, () =>
    saveSettingsSoon(),
  );
  const devRolesState = useDevRoles(() => saveSettingsSoon());
  const skillsState = useSkillsCatalog(() => saveSettingsSoon());

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
      swarm_visual_probe_enabled: form.swarm_visual_probe_enabled,
      swarm_visual_base_url: form.swarm_visual_base_url,
      swarm_visual_start_command: form.swarm_visual_start_command,
      swarm_visual_start_directory: form.swarm_visual_start_directory,
      swarm_visual_ready_path: form.swarm_visual_ready_path,
      swarm_visual_pages: form.swarm_visual_pages,
      swarm_visual_capture_har: form.swarm_visual_capture_har,
      swarm_visual_capture_trace: form.swarm_visual_capture_trace,
      swarm_visual_multimodal_review: form.swarm_visual_multimodal_review,
      swarm_visual_max_review_images: form.swarm_visual_max_review_images,
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
      scenario_id: form.scenario_id,
      custom_scenario_id: form.custom_scenario_id,
      custom_scenarios: JSON.parse(JSON.stringify(form.custom_scenarios)),
      favorite_scenarios: [...form.favorite_scenarios],
      scenario_overrides: JSON.parse(JSON.stringify(form.scenario_overrides)),
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

  const persistence = useSettingsPersistence({
    isBooting,
    collectSnap,
    workspaceRoot: () => form.workspace_root,
  });

  const {
    saveSettingsSoon,
    flushSave,
    flushSaveAsync,
    saveSettingsToStorage,
    loadProjectSnap,
    loadLegacySearchKeys,
  } = persistence;

  function applyRemoteProviderDefaultUrl(): void {
    applyRemoteProviderDefaultUrlOn(form);
  }

  async function applySnap(snap: SettingsSnap): Promise<void> {
    if (!snap || snap.v !== 1) return;
    applyFormFromSnap(form, snap);

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

  async function reloadProjectFile(): Promise<boolean> {
    if (isBooting.value) return false;
    const workspaceRoot = form.workspace_root.trim();
    if (!workspaceRoot) return false;
    const snap = await loadProjectSnap(workspaceRoot);
    if (!snap || snap.v !== 1) return false;
    const incoming = JSON.stringify(snap);
    if (incoming === JSON.stringify(collectSnap())) return false;

    isBooting.value = true;
    rolesState.isBooting.value = true;
    try {
      await applySnap(snap);
      projectsStore.saveSnap(snap);
      return true;
    } finally {
      isBooting.value = false;
      rolesState.isBooting.value = false;
    }
  }

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
    reloadProjectFile,
    applyRemoteProviderDefaultUrl,
    ...lifecycle,
  };
}
