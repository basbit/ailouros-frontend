import type { Ref } from "vue";
import { useProjectsStore, buildEmptySnap } from "@/shared/store/projects";
import type { SettingsSnap } from "@/shared/store/projects";

interface ProjectLifecycleDeps {
  isBooting: Ref<boolean>;
  rolesIsBooting: Ref<boolean>;
  applySnap(snap: SettingsSnap): Promise<void>;
  resetPipelineIfEmpty(): void;
  flushSave(): void;
  flushSaveAsync(): Promise<void>;
  saveToStorage(): void;
  loadProjectSnap(workspaceRoot: string): Promise<SettingsSnap | null>;
  loadGlobalProfiles(): void;
  loadLegacySearchKeys(): Partial<
    Pick<
      SettingsSnap,
      "swarm_tavily_api_key" | "swarm_exa_api_key" | "swarm_scrapingdog_api_key"
    >
  >;
  applyDefaultProviderUrl(): void;
}

export function useProjectLifecycle(deps: ProjectLifecycleDeps) {
  const projectsStore = useProjectsStore();

  function _mergeLegacySearchKeys(snap: SettingsSnap | null): {
    snap: SettingsSnap | null;
    needsSave: boolean;
  } {
    if (!snap || snap.v !== 1) return { snap, needsSave: false };

    const legacy = deps.loadLegacySearchKeys();
    let needsSave = false;
    const merged: SettingsSnap = { ...snap };

    if (!merged.swarm_tavily_api_key && legacy.swarm_tavily_api_key) {
      merged.swarm_tavily_api_key = legacy.swarm_tavily_api_key;
      needsSave = true;
    }
    if (!merged.swarm_exa_api_key && legacy.swarm_exa_api_key) {
      merged.swarm_exa_api_key = legacy.swarm_exa_api_key;
      needsSave = true;
    }
    if (!merged.swarm_scrapingdog_api_key && legacy.swarm_scrapingdog_api_key) {
      merged.swarm_scrapingdog_api_key = legacy.swarm_scrapingdog_api_key;
      needsSave = true;
    }

    return { snap: merged, needsSave };
  }

  async function _bootWith(snap: SettingsSnap | null | undefined): Promise<void> {
    deps.isBooting.value = true;
    deps.rolesIsBooting.value = true;
    try {
      await deps.applySnap(snap && snap.v === 1 ? snap : buildEmptySnap());
      deps.resetPipelineIfEmpty();
    } finally {
      deps.isBooting.value = false;
      deps.rolesIsBooting.value = false;
    }
  }

  async function _resolveProjectSnap(snap: SettingsSnap | null | undefined): Promise<{
    snap: SettingsSnap | null;
    fromProjectFile: boolean;
    needsSave: boolean;
  }> {
    if (!snap || snap.v !== 1) {
      return { snap: null, fromProjectFile: false, needsSave: false };
    }
    const workspaceRoot = (snap.workspace_root ?? "").trim();
    if (!workspaceRoot) {
      const merged = _mergeLegacySearchKeys(snap);
      return { ...merged, fromProjectFile: false };
    }
    const fileSnap = await deps.loadProjectSnap(workspaceRoot);
    if (fileSnap && fileSnap.v === 1) {
      const merged = _mergeLegacySearchKeys(fileSnap);
      return { ...merged, fromProjectFile: true };
    }
    const merged = _mergeLegacySearchKeys(snap);
    return { ...merged, fromProjectFile: false };
  }

  async function init(): Promise<void> {
    const projectsData = projectsStore.ensure();
    deps.loadGlobalProfiles();
    const currentSnap = projectsData.projects[projectsData.current]?.snap;
    const resolved = await _resolveProjectSnap(currentSnap);
    await _bootWith(resolved.snap);
    if (
      resolved.snap?.workspace_root?.trim() &&
      (resolved.needsSave || !resolved.fromProjectFile)
    ) {
      await deps.flushSaveAsync();
    }
  }

  async function switchProject(id: string): Promise<void> {
    await deps.flushSaveAsync();
    const snap = projectsStore.switchTo(id);
    const resolved = await _resolveProjectSnap(snap);
    await _bootWith(resolved.snap);
    deps.saveToStorage();
    if (
      resolved.snap?.workspace_root?.trim() &&
      (resolved.needsSave || !resolved.fromProjectFile)
    ) {
      await deps.flushSaveAsync();
    }
  }

  async function newProject(name: string): Promise<string> {
    await deps.flushSaveAsync();
    const id = projectsStore.createProject(name);
    await _bootWith(null);
    deps.applyDefaultProviderUrl();
    deps.saveToStorage();
    return id;
  }

  async function deleteCurrentProject(): Promise<string | null> {
    await deps.flushSaveAsync();
    const newCurrentId = projectsStore.deleteProject(projectsStore.currentId);
    if (!newCurrentId) return null;
    const resolved = await _resolveProjectSnap(projectsStore.getCurrentSnap());
    await _bootWith(resolved.snap);
    deps.saveToStorage();
    if (
      resolved.snap?.workspace_root?.trim() &&
      (resolved.needsSave || !resolved.fromProjectFile)
    ) {
      await deps.flushSaveAsync();
    }
    return newCurrentId;
  }

  return { init, switchProject, newProject, deleteCurrentProject };
}
