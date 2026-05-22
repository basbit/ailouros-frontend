import type { Ref } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import type { SettingsSnap } from "@/entities/project";
import {
  loadProjectSettings,
  saveProjectSettings,
} from "@/shared/api/endpoints/project-settings";
import { loadJSON } from "@/shared/lib/storage-utils";
import { typedGlobalSearchKeys } from "@/shared/lib/storage-keys";

interface PersistenceDeps {
  isBooting: Ref<boolean>;
  collectSnap(): SettingsSnap;
  workspaceRoot(): string;
}

export function useSettingsPersistence(deps: PersistenceDeps) {
  const projectsStore = useProjectsStore();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  async function persistSettings(): Promise<void> {
    const snap = deps.collectSnap();
    try {
      projectsStore.saveSnap(snap);
    } catch {
      void 0;
    }
    const workspaceRoot = snap.workspace_root.trim();
    if (!workspaceRoot) return;
    try {
      await saveProjectSettings(workspaceRoot, snap);
    } catch {
      void 0;
    }
  }

  function saveSettingsSoon(): void {
    if (deps.isBooting.value) return;
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      void persistSettings();
    }, 400);
  }

  function flushSave(): void {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    void persistSettings();
  }

  async function flushSaveAsync(): Promise<void> {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await persistSettings();
  }

  function saveSettingsToStorage(): void {
    void persistSettings();
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
    const entry = typedGlobalSearchKeys<{
      tavily?: unknown;
      exa?: unknown;
      scrapingdog?: unknown;
    }>();
    const parsed = loadJSON<{
      tavily?: unknown;
      exa?: unknown;
      scrapingdog?: unknown;
    } | null>(entry.key, null);
    if (!parsed) return {};
    return {
      swarm_tavily_api_key: String(parsed.tavily ?? "").trim(),
      swarm_exa_api_key: String(parsed.exa ?? "").trim(),
      swarm_scrapingdog_api_key: String(parsed.scrapingdog ?? "").trim(),
    };
  }

  return {
    saveSettingsSoon,
    flushSave,
    flushSaveAsync,
    saveSettingsToStorage,
    loadProjectSnap,
    loadLegacySearchKeys,
  };
}
