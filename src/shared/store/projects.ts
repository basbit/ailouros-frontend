import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  LS_PROJECTS,
  LS_SETTINGS,
  LS_HISTORY,
  LS_ACTIVE_TASK,
  LS_EVENTS_VIEW,
} from "@/shared/lib/swarm-ui-constants";
import { ROLES } from "@/shared/lib/pipeline-schema";
import {
  defaultEnvironmentForRole,
  defaultModelForRole,
  defaultPipelineOrder,
  defaultPromptPathForRole,
  defaultRemoteApiProvider,
  defaultSwarmProvider,
} from "@/shared/lib/use-swarm-defaults";

// Domain types live in entities; re-exported here for backward compatibility.
export type {
  RemoteProfileRow,
  RoleSnapshot,
  CustomRoleSnap,
  DevRoleSnap,
  SkillCatalogSnap,
  SettingsSnap,
  ProjectEntry,
  ProjectsData,
} from "@/entities/project/model/types";
import type {
  RoleSnapshot,
  SettingsSnap,
  ProjectEntry,
  ProjectsData,
} from "@/entities/project/model/types";

function buildEmptyRoleSnapshots(): Record<string, RoleSnapshot> {
  const roles: Record<string, RoleSnapshot> = {};
  for (const r of ROLES) {
    const environment = defaultEnvironmentForRole();
    roles[r] = {
      environment,
      model: defaultModelForRole(r, environment),
      prompt_path: defaultPromptPathForRole(r),
      skill_ids: "",
    };
  }
  return roles;
}

export function buildEmptySnap(): SettingsSnap {
  return {
    v: 1,
    prompt: "",
    pipeline: defaultPipelineOrder().map((s) => ({ id: s })),
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
    remote_api_provider: defaultRemoteApiProvider(),
    remote_api_key: "",
    remote_api_base_url: "",
    remote_api_profile_rows: [],
    custom_roles: [],
    dev_roles: [],
    skills_catalog: [],
    roles: buildEmptyRoleSnapshots(),
  };
}

export const useProjectsStore = defineStore("projects", () => {
  const data = ref<ProjectsData | null>(null);

  const currentId = computed(() => data.value?.current ?? "default");
  const currentProject = computed<ProjectEntry | null>(
    () => data.value?.projects[currentId.value] ?? null,
  );
  const projectList = computed(() => {
    if (!data.value) return [];
    return Object.keys(data.value.projects)
      .sort()
      .map((id) => ({ id, name: data.value!.projects[id].name || id }));
  });

  function _save(d: ProjectsData): void {
    try {
      localStorage.setItem(LS_PROJECTS, JSON.stringify(d));
    } catch {
      /* quota */
    }
  }

  function _load(): ProjectsData | null {
    try {
      const raw = localStorage.getItem(LS_PROJECTS);
      if (!raw) return null;
      const d = JSON.parse(raw) as ProjectsData;
      if (!d || d.v !== 1 || typeof d.projects !== "object") return null;
      return d;
    } catch {
      return null;
    }
  }

  function _migrateLegacy(): ProjectsData | null {
    try {
      const raw = localStorage.getItem(LS_SETTINGS);
      if (!raw) return null;
      const snap = JSON.parse(raw) as SettingsSnap;
      if (!snap || snap.v !== 1) return null;
      const id = "default";
      const pdata: ProjectsData = {
        v: 1,
        current: id,
        projects: { [id]: { name: "Default", snap } },
      };
      _save(pdata);
      return pdata;
    } catch {
      return null;
    }
  }

  function ensure(): ProjectsData {
    let pdata = _load();
    if (pdata && pdata.v === 1 && pdata.projects) {
      const ids = Object.keys(pdata.projects);
      if (ids.length) {
        if (!pdata.current || !pdata.projects[pdata.current]) {
          pdata.current = ids[0];
          _save(pdata);
        }
        data.value = pdata;
        return pdata;
      }
    }
    const migrated = _migrateLegacy();
    if (migrated) {
      data.value = migrated;
      return migrated;
    }
    const id = "default";
    pdata = {
      v: 1,
      current: id,
      projects: { [id]: { name: "Default", snap: buildEmptySnap() } },
    };
    _save(pdata);
    data.value = pdata;
    return pdata;
  }

  function saveSnap(snap: SettingsSnap): void {
    if (!data.value) return;
    const cur = data.value.current;
    if (cur && data.value.projects[cur]) {
      data.value.projects[cur].snap = snap;
    }
    // Also write to LS_SETTINGS for legacy compat
    try {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(snap));
    } catch {
      /* quota */
    }
    _save(data.value);
  }

  function switchTo(id: string): SettingsSnap | null {
    if (!data.value || !data.value.projects[id]) return null;
    data.value.current = id;
    _save(data.value);
    return data.value.projects[id].snap;
  }

  function createProject(name: string): string {
    const id =
      "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    if (!data.value) ensure();
    data.value!.projects[id] = { name, snap: buildEmptySnap() };
    data.value!.current = id;
    _save(data.value!);
    return id;
  }

  function renameProject(id: string, name: string): void {
    if (!data.value?.projects[id]) return;
    data.value.projects[id].name = name;
    _save(data.value);
  }

  function deleteProject(id: string): string | null {
    if (!data.value) return null;
    const ids = Object.keys(data.value.projects);
    if (ids.length <= 1) return null;
    // Clean per-project localStorage keys
    try {
      localStorage.removeItem(LS_HISTORY + "_" + id);
      localStorage.removeItem(LS_ACTIVE_TASK + "_" + id);
      localStorage.removeItem(LS_EVENTS_VIEW + "_" + id);
    } catch {
      /* ignore */
    }
    delete data.value.projects[id];
    data.value.current = Object.keys(data.value.projects)[0];
    _save(data.value);
    return data.value.current;
  }

  function getCurrentSnap(): SettingsSnap | null {
    return data.value?.projects[data.value.current]?.snap ?? null;
  }

  return {
    data,
    currentId,
    currentProject,
    projectList,
    ensure,
    saveSnap,
    switchTo,
    createProject,
    renameProject,
    deleteProject,
    getCurrentSnap,
  };
});
