import type { TypedStorageKey } from "@/shared/lib/storage-utils";

export const STORAGE_KEYS = {
  swarmDefaults: {
    key: "swarm_ui_defaults_v1",
    default: null as unknown,
  },
  globalSettings: {
    key: "swarm_ui_global_settings_v1",
    default: null as unknown,
  },
  globalSearchKeys: {
    key: "swarm_ui_global_search_keys_v1",
    default: null as unknown,
  },
  promptLibraryByProject: {
    prefix: "ailouros.prompt-library.",
    default: [] as unknown[],
  },
  scenarioFirstRunDismissed: {
    key: "ailouros.first-run-scenario-panel.dismissed",
  },
  eventsFeedOpen: {
    key: "swarm.events-feed-open",
  },
  historyPanelOpen: {
    key: "swarm.history-panel-open",
  },
  artifactsPanelOpen: {
    key: "swarm.artifacts-panel-open",
  },
  advancedSidebarOpen: {
    key: "swarm.sidebar-advanced-open",
  },
  updateBannerDismissedRef: {
    key: "swarm.update-banner-dismissed-ref",
  },
  preferenceLocale: {
    key: "ailouros.locale",
  },
  preferenceTheme: {
    key: "ailouros.theme",
  },
  preferenceSidebarCollapsed: {
    key: "ailouros.sidebar_collapsed",
  },
  preferenceDensity: {
    key: "ailouros.density",
  },
} as const;

function promptLibraryKey(projectId: string): string {
  return `${STORAGE_KEYS.promptLibraryByProject.prefix}${projectId}`;
}

export function typedSwarmDefaults<T>(): TypedStorageKey<T | null> {
  return { key: STORAGE_KEYS.swarmDefaults.key, default: null };
}

export function typedGlobalSettings<T>(): TypedStorageKey<T | null> {
  return { key: STORAGE_KEYS.globalSettings.key, default: null };
}

export function typedGlobalSearchKeys<T>(): TypedStorageKey<T | null> {
  return { key: STORAGE_KEYS.globalSearchKeys.key, default: null };
}

export function typedPromptLibrary<T>(
  projectId: string,
  fallback: T,
): TypedStorageKey<T> {
  return { key: promptLibraryKey(projectId), default: fallback };
}
