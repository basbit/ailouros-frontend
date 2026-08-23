import { reactive } from "vue";
import {
  getUserSettings,
  putUserSettings,
  type UserSettingsDto,
} from "@/shared/api/endpoints/user-settings";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import type { GlobalSearchKeysState, StateKey } from "./types";
import { DEFAULTS, isBoolKey } from "./defaults";

export type { GlobalSearchKeysState, StateKey };
import { isMaskedSecret } from "./secret-policy";
import { loadFromStorage, saveToStorage } from "./persistence";
import { buildSyncPayload as buildPayload } from "./sync-payload";

const state = reactive<GlobalSearchKeysState>({ ...DEFAULTS });

let initialized = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function ensureInitialized(): void {
  if (initialized) return;
  loadFromStorage(state);
  initialized = true;
}

export function buildSyncPayload(): Partial<UserSettingsDto> {
  return buildPayload(state);
}

export function getGlobalSearchKeys(): {
  tavily: string;
  exa: string;
  scrapingdog: string;
} {
  ensureInitialized();
  return {
    tavily: state.tavily_api_key,
    exa: state.exa_api_key,
    scrapingdog: state.scrapingdog_api_key,
  };
}

export function getGlobalAutomationSettings(): Pick<
  GlobalSearchKeysState,
  Exclude<StateKey, "tavily_api_key" | "exa_api_key" | "scrapingdog_api_key">
> {
  ensureInitialized();
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(DEFAULTS) as StateKey[]) {
    if (
      key === "tavily_api_key" ||
      key === "exa_api_key" ||
      key === "scrapingdog_api_key"
    ) {
      continue;
    }
    out[key] = state[key];
  }
  return out as ReturnType<typeof getGlobalAutomationSettings>;
}

export function useGlobalSearchKeys() {
  ensureInitialized();

  function setKey(field: StateKey, value: string | boolean): void {
    if (isBoolKey(field)) {
      (state as Record<StateKey, unknown>)[field] = Boolean(value);
    } else {
      (state as Record<StateKey, unknown>)[field] = String(value);
    }
    if (syncTimer !== null) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      saveToStorage(state);
      void putUserSettings(buildSyncPayload()).catch((error) => {
        frontendLogger.warn("user settings sync failed", error);
      });
    }, 400);
  }

  async function loadFromBackend(): Promise<void> {
    let data: Awaited<ReturnType<typeof getUserSettings>>;
    try {
      data = await getUserSettings();
    } catch (error) {
      frontendLogger.warn("user settings load failed", error);
      return;
    }
    let changed = false;
    for (const key of Object.keys(DEFAULTS) as StateKey[]) {
      if (!(key in data)) continue;
      const value = (data as Record<string, unknown>)[key];
      if (value === undefined) continue;
      if (isMaskedSecret(key, value)) continue;
      if (isBoolKey(key)) {
        const next = Boolean(value);
        if (state[key] !== next) {
          (state as Record<StateKey, unknown>)[key] = next;
          changed = true;
        }
      } else {
        const next = String(value ?? "");
        if (state[key] !== next) {
          (state as Record<StateKey, unknown>)[key] = next;
          changed = true;
        }
      }
    }
    if (changed) saveToStorage(state);
  }

  return { state, setKey, loadFromBackend };
}
