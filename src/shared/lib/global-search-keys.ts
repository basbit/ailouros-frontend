import { reactive } from "vue";
import {
  getUserSettings,
  putUserSettings,
  type UserSettingsDto,
} from "@/shared/api/endpoints/user-settings";
import { LS_GLOBAL_SETTINGS } from "@/shared/lib/swarm-ui-constants";

export interface GlobalSearchKeysState {
  // Secret API keys
  tavily_api_key: string;
  exa_api_key: string;
  scrapingdog_api_key: string;

  // Automation & Quality (moved from project scope)
  swarm_self_verify: boolean;
  swarm_self_verify_model: string;
  swarm_self_verify_provider: string;
  swarm_auto_approve: string;
  swarm_auto_approve_timeout: string;
  swarm_auto_retry: boolean;
  swarm_max_step_retries: string;
  swarm_deep_planning: boolean;
  swarm_deep_planning_model: string;
  swarm_deep_planning_provider: string;
  swarm_background_agent: boolean;
  swarm_background_agent_model: string;
  swarm_background_agent_provider: string;
  swarm_background_watch_paths: string;
  swarm_dream_enabled: boolean;
  swarm_quality_gate: boolean;
  swarm_auto_plan: boolean;
  swarm_planner_model: string;
  swarm_planner_provider: string;
}

const _DEFAULTS: GlobalSearchKeysState = {
  tavily_api_key: "",
  exa_api_key: "",
  scrapingdog_api_key: "",
  swarm_self_verify: false,
  swarm_self_verify_model: "",
  swarm_self_verify_provider: "",
  swarm_auto_approve: "",
  swarm_auto_approve_timeout: "",
  swarm_auto_retry: false,
  swarm_max_step_retries: "",
  swarm_deep_planning: false,
  swarm_deep_planning_model: "",
  swarm_deep_planning_provider: "",
  swarm_background_agent: false,
  swarm_background_agent_model: "",
  swarm_background_agent_provider: "",
  swarm_background_watch_paths: "",
  swarm_dream_enabled: false,
  swarm_quality_gate: false,
  swarm_auto_plan: false,
  swarm_planner_model: "",
  swarm_planner_provider: "",
};

const state = reactive<GlobalSearchKeysState>({ ..._DEFAULTS });

let initialized = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

type StateKey = keyof GlobalSearchKeysState;

function isBoolKey(key: StateKey): boolean {
  return typeof _DEFAULTS[key] === "boolean";
}

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(LS_GLOBAL_SETTINGS);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<GlobalSearchKeysState>;
    if (!parsed || typeof parsed !== "object") return;
    for (const key of Object.keys(_DEFAULTS) as StateKey[]) {
      const value = parsed[key];
      if (value === undefined) continue;
      if (isBoolKey(key)) {
        (state as Record<StateKey, unknown>)[key] = Boolean(value);
      } else {
        (state as Record<StateKey, unknown>)[key] = String(value);
      }
    }
  } catch {
    // Storage is best-effort only.
  }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(LS_GLOBAL_SETTINGS, JSON.stringify(state));
  } catch {
    // Storage quota is non-fatal here.
  }
}

function ensureInitialized(): void {
  if (initialized) return;
  loadFromStorage();
  initialized = true;
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
  for (const key of Object.keys(_DEFAULTS) as StateKey[]) {
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

function buildSyncPayload(): Partial<UserSettingsDto> {
  const payload: Record<string, unknown> = {};
  for (const key of Object.keys(_DEFAULTS) as StateKey[]) {
    payload[key] = state[key];
  }
  return payload as Partial<UserSettingsDto>;
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
      saveToStorage();
      void putUserSettings(buildSyncPayload()).catch(() => {});
    }, 400);
  }

  async function loadFromBackend(): Promise<void> {
    try {
      const data = await getUserSettings();
      let changed = false;
      for (const key of Object.keys(_DEFAULTS) as StateKey[]) {
        if (!(key in data)) continue;
        const value = (data as Record<string, unknown>)[key];
        if (value === undefined) continue;
        // Secret keys come back masked ("***") — keep the local user-entered
        // value in that case instead of clobbering with mask.
        const isSecret =
          key === "tavily_api_key" ||
          key === "exa_api_key" ||
          key === "scrapingdog_api_key";
        if (isSecret && value === "***") continue;
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
      if (changed) saveToStorage();
    } catch {
      // Backend sync is optional; local state stays authoritative for the UI.
    }
  }

  return { state, setKey, loadFromBackend };
}
