import type {
  CustomRoleSnap,
  DevRoleSnap,
  SettingsSnap,
} from "@/shared/model/project-types";

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
  | "swarm_visual_probe_enabled"
  | "swarm_visual_base_url"
  | "swarm_visual_start_command"
  | "swarm_visual_start_directory"
  | "swarm_visual_ready_path"
  | "swarm_visual_pages"
  | "swarm_visual_capture_har"
  | "swarm_visual_capture_trace"
  | "swarm_visual_multimodal_review"
  | "swarm_visual_max_review_images"
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
  | "scenario_id"
  | "favorite_scenarios"
  | "scenario_overrides"
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

interface PipelineStateLike {
  collectStepIds(): string[];
  collectStages(): string[][];
}

export interface RunSwarmChatSettings extends AgentConfigSettings {
  pipelineState: PipelineStateLike;
}
