import { defineStore } from "pinia";
import { ref } from "vue";

/** Per-role model/env config (mirrors the shape in ui.js collectSettingsSnapshot). */
export interface RoleConfig {
  environment: string;
  model: string;
  prompt_path: string;
  skill_ids?: string;
  remote_profile?: string;
}

/** A full settings snapshot as stored in localStorage under LS_SETTINGS. */
export interface SettingsSnapshot {
  v: number;
  prompt: string;
  pipeline: unknown[];
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
  remote_api_provider: string;
  remote_api_key: string;
  remote_api_base_url: string;
  remote_api_profile_rows: unknown[];
  custom_roles: unknown[];
  dev_roles: unknown[];
  skills_catalog: unknown[];
  roles: Record<string, RoleConfig>;
}

/** Keys that ui.js uses in localStorage (kept in sync for interop). */
export const LS_SETTINGS = "swarm_ui_settings_v1";

export const useSettingsStore = defineStore("settings", () => {
  const snapshot = ref<SettingsSnapshot | null>(null);
  const prompt = ref<string>("");
  const workspaceRoot = ref<string>("");
  const projectContextFile = ref<string>("");
  const workspaceWrite = ref<boolean>(false);
  const pipeline = ref<unknown[]>([]);
  const roles = ref<Record<string, RoleConfig>>({});

  /**
   * Persist the current snapshot to localStorage (key matches ui.js so both
   * sides read/write the same entry during the migration period).
   */
  function save(snap: SettingsSnapshot): void {
    snapshot.value = snap;
    prompt.value = snap.prompt ?? "";
    workspaceRoot.value = snap.workspace_root ?? "";
    projectContextFile.value = snap.project_context_file ?? "";
    workspaceWrite.value = snap.workspace_write ?? false;
    pipeline.value = snap.pipeline ?? [];
    roles.value = snap.roles ?? {};

    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(snap));
    } catch {
      // Quota exceeded or private mode — silently ignore.
    }
  }

  /**
   * Load the snapshot from localStorage and populate reactive state.
   * Returns the parsed snapshot or null if nothing is stored yet.
   */
  function load(): SettingsSnapshot | null {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SettingsSnapshot;
      applySnapshot(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  /** Apply a snapshot object to the reactive store without re-persisting. */
  function applySnapshot(snap: SettingsSnapshot): void {
    snapshot.value = snap;
    prompt.value = snap.prompt ?? "";
    workspaceRoot.value = snap.workspace_root ?? "";
    projectContextFile.value = snap.project_context_file ?? "";
    workspaceWrite.value = snap.workspace_write ?? false;
    pipeline.value = snap.pipeline ?? [];
    roles.value = snap.roles ?? {};
  }

  return {
    snapshot,
    prompt,
    workspaceRoot,
    projectContextFile,
    workspaceWrite,
    pipeline,
    roles,
    save,
    load,
    applySnapshot,
  };
});
