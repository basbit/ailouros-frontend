import { reactive, ref } from "vue";
import {
  getUserSettings,
  putUserSettings,
  type UserSettingsDto,
} from "@/shared/api/endpoints/user-settings";
import { describeApiError } from "@/shared/api/api-error-detail";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import type { GlobalSearchKeysState, StateKey } from "./types";
import { DEFAULTS, isBoolKey } from "./defaults";

export type { GlobalSearchKeysState, StateKey };
import { isMaskedSecret, MASKED_SECRET, SERVER_ONLY_SECRET_KEYS } from "./secret-policy";
import { loadFromStorage, saveToStorage } from "./persistence";
import { buildSyncPayload as buildPayload } from "./sync-payload";
import { readFieldSources, type SettingSource } from "./setting-source";
import { applyRestartStatus } from "./restart-status";

export type { SettingSource };

const state = reactive<GlobalSearchKeysState>({ ...DEFAULTS });
const syncError = ref("");
const fieldSources = reactive<Record<string, SettingSource>>({});
const dirtyKeys = new Set<StateKey>();

let initialized = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let inFlightSync: Promise<void> = Promise.resolve();

function maskServerOnlySecrets(sent: Partial<UserSettingsDto>): void {
  const record = state as unknown as Record<string, unknown>;
  const sentRecord = sent as Record<string, unknown>;
  for (const key of SERVER_ONLY_SECRET_KEYS) {
    const value = sentRecord[key];
    if (typeof value === "string" && value && record[key] === value) {
      record[key] = MASKED_SECRET;
    }
  }
}

async function refreshServerStatus(): Promise<void> {
  try {
    const data = await getUserSettings();
    if (!data || typeof data !== "object") return;
    Object.assign(fieldSources, readFieldSources(data));
    applyRestartStatus(data);
  } catch (error) {
    frontendLogger.warn("user settings status refresh failed", error);
  }
}

function syncNow(): Promise<void> {
  saveToStorage(state);
  const sentKeys = [...dirtyKeys];
  if (!sentKeys.length) return inFlightSync;
  const payload = buildPayload(state, sentKeys);
  dirtyKeys.clear();
  inFlightSync = putUserSettings(payload)
    .then(() => {
      syncError.value = "";
      for (const key of sentKeys) fieldSources[key] = "ui";
      maskServerOnlySecrets(payload);
      saveToStorage(state);
      return refreshServerStatus();
    })
    .catch((error: unknown) => {
      for (const key of sentKeys) dirtyKeys.add(key);
      syncError.value = describeApiError(error);
      frontendLogger.warn("user settings sync failed", error);
    });
  return inFlightSync;
}

function backendValueFor(key: StateKey, value: unknown): string | boolean | null {
  if (isMaskedSecret(key, value)) {
    return state[key] ? null : MASKED_SECRET;
  }
  return isBoolKey(key) ? Boolean(value) : String(value ?? "");
}

function applyBackendValue(key: StateKey, value: unknown): boolean {
  const next = backendValueFor(key, value);
  if (next === null || state[key] === next) return false;
  (state as Record<StateKey, unknown>)[key] = next;
  return true;
}

/** Send a pending debounced save now and wait for it (and one in flight). */
export async function flushGlobalSettingsSync(): Promise<void> {
  if (syncTimer !== null) {
    clearTimeout(syncTimer);
    syncTimer = null;
    await syncNow();
    return;
  }
  await inFlightSync;
}

/** The server now holds these secrets: keep only the mask locally. */
export function markSecretsSavedOnServer(keys: readonly StateKey[]): void {
  for (const key of keys) {
    (state as Record<StateKey, unknown>)[key] = MASKED_SECRET;
  }
  saveToStorage(state);
}

function ensureInitialized(): void {
  if (initialized) return;
  loadFromStorage(state);
  initialized = true;
}

/** What the next save would send: only the fields edited since the last save. */
export function buildSyncPayload(): Partial<UserSettingsDto> {
  return buildPayload(state, [...dirtyKeys]);
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
    dirtyKeys.add(field);
    if (isBoolKey(field)) {
      (state as Record<StateKey, unknown>)[field] = Boolean(value);
    } else {
      (state as Record<StateKey, unknown>)[field] = String(value);
    }
    if (syncTimer !== null) clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      syncTimer = null;
      void syncNow();
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
    Object.assign(fieldSources, readFieldSources(data));
    applyRestartStatus(data);
    for (const key of Object.keys(DEFAULTS) as StateKey[]) {
      if (!(key in data) || dirtyKeys.has(key)) continue;
      const value = (data as Record<string, unknown>)[key];
      if (value === undefined) continue;
      changed = applyBackendValue(key, value) || changed;
    }
    if (changed) saveToStorage(state);
  }

  /** Where the field's value comes from; an edit not yet saved counts as the UI's. */
  function sourceOf(field: StateKey): SettingSource {
    if (dirtyKeys.has(field)) return "ui";
    return fieldSources[field] ?? "default";
  }

  return { state, setKey, loadFromBackend, syncError, sourceOf };
}
