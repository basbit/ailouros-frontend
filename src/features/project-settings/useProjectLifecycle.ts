import type { Ref } from "vue";
import { useProjectsStore, buildEmptySnap } from "@/shared/store/projects";
import type { SettingsSnap } from "@/shared/store/projects";

interface ProjectLifecycleDeps {
  isBooting: Ref<boolean>;
  rolesIsBooting: Ref<boolean>;
  applySnap(snap: SettingsSnap): Promise<void>;
  resetPipelineIfEmpty(): void;
  flushSave(): void;
  saveToStorage(): void;
  loadGlobalProfiles(): void;
  applyDefaultProviderUrl(): void;
}

export function useProjectLifecycle(deps: ProjectLifecycleDeps) {
  const projectsStore = useProjectsStore();

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

  async function init(): Promise<void> {
    const projectsData = projectsStore.ensure();
    deps.loadGlobalProfiles();
    const snap = projectsData.projects[projectsData.current]?.snap;
    await _bootWith(snap);
  }

  async function switchProject(id: string): Promise<void> {
    deps.flushSave();
    const snap = projectsStore.switchTo(id);
    await _bootWith(snap);
    deps.saveToStorage();
  }

  async function newProject(name: string): Promise<string> {
    deps.flushSave();
    const id = projectsStore.createProject(name);
    await _bootWith(null);
    deps.applyDefaultProviderUrl();
    deps.saveToStorage();
    return id;
  }

  async function deleteCurrentProject(): Promise<string | null> {
    deps.flushSave();
    const newCurrentId = projectsStore.deleteProject(projectsStore.currentId);
    if (!newCurrentId) return null;
    const snap = projectsStore.getCurrentSnap();
    await _bootWith(snap);
    deps.saveToStorage();
    return newCurrentId;
  }

  return { init, switchProject, newProject, deleteCurrentProject };
}
