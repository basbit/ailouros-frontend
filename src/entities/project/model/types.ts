export interface RemoteProfileRow {
  id: string;
  provider: string;
  api_key: string;
  base_url: string;
}

export interface RoleSnapshot {
  environment: string;
  model: string;
  prompt_path: string;
  skill_ids?: string;
  remote_profile?: string;
}

export interface CustomRoleSnap {
  id: string;
  label: string;
  environment: string;
  model: string;
  prompt_path: string;
  prompt_text: string;
  skill_ids: string;
}

export interface DevRoleSnap {
  name: string;
  environment: string;
  model?: string;
  prompt_path?: string;
  scope?: string;
}

export interface SkillCatalogSnap {
  id: string;
  title: string;
  path: string;
}

export interface SettingsSnap {
  v: 1;
  prompt: string;
  pipeline: { id: string }[];
  pipeline_stages?: string[][];
  workspace_root: string;
  project_context_file: string;
  workspace_write: boolean;
  human_manual_review: boolean;
  swarm_languages: string;
  swarm_topology: string;
  swarm_pattern_memory: boolean;
  swarm_pipeline_hooks_module: string;
  swarm_mcp_auto: boolean;
  swarm_skip_mcp_tools: boolean;
  swarm_doc_locale: string;
  swarm_documentation_sources: string;
  swarm_database_url: string;
  swarm_database_hint: string;
  swarm_database_readonly: boolean;
  swarm_disable_tree_sitter: boolean;
  mcp_servers_json: string;
  swarm_tavily_api_key?: string;
  swarm_exa_api_key?: string;
  swarm_scrapingdog_api_key?: string;
  // Media generation (§26)
  media_enabled?: boolean;
  media_image_provider?: string;
  media_image_model?: string;
  media_image_api_key?: string;
  media_audio_provider?: string;
  media_audio_model?: string;
  media_audio_api_key?: string;
  media_audio_voice?: string;
  media_budget_max_cost_usd?: string;
  media_budget_max_attempts?: string;
  media_license_policy?: string;
  swarm_self_verify: boolean;
  swarm_self_verify_model: string;
  swarm_auto_approve: string;
  swarm_auto_approve_timeout: string;
  swarm_auto_retry: boolean;
  swarm_max_step_retries: string;
  swarm_deep_planning: boolean;
  swarm_deep_planning_model: string;
  swarm_background_agent: boolean;
  swarm_background_agent_model: string;
  swarm_background_agent_provider?: string;
  swarm_background_watch_paths: string;
  swarm_dream_enabled: boolean;
  swarm_quality_gate: boolean;
  swarm_auto_plan: boolean;
  swarm_planner_model: string;
  swarm_memory_namespace: string;
  swarm_pattern_memory_path: string;
  swarm_force_rerun: boolean;
  swarm_self_verify_provider?: string;
  swarm_deep_planning_provider?: string;
  swarm_planner_provider?: string;
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
  remote_api_profile_rows: RemoteProfileRow[];
  custom_roles: CustomRoleSnap[];
  dev_roles: DevRoleSnap[];
  skills_catalog: SkillCatalogSnap[];
  roles: Record<string, RoleSnapshot>;
}

export interface ProjectEntry {
  name: string;
  snap: SettingsSnap;
}

export interface ProjectsData {
  v: 1;
  current: string;
  projects: Record<string, ProjectEntry>;
}
