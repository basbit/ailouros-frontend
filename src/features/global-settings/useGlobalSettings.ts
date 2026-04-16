/**
 * useGlobalSettings — manages cross-project (global) settings.
 *
 * Currently covers: web search API keys (Tavily, Exa, ScrapingDog).
 * Stored in localStorage under LS_GLOBAL_SETTINGS and synced to the
 * backend at PUT /v1/user/settings so the server can use the keys even
 * without a per-request agent_config.
 *
 * Module-level singleton: the reactive state is shared across all
 * composable invocations in the same app instance.
 */
import { reactive } from "vue";
import { apiUrl } from "@/shared/api/base";
import { LS_GLOBAL_SETTINGS } from "@/shared/lib/swarm-ui-constants";

export interface GlobalSettingsData {
  tavily_api_key: string;
  exa_api_key: string;
  scrapingdog_api_key: string;
}

// ── Module-level singleton ────────────────────────────────────────────────────

const _state = reactive<GlobalSettingsData>({
  tavily_api_key: "",
  exa_api_key: "",
  scrapingdog_api_key: "",
});

let _initialized = false;

function _loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(LS_GLOBAL_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GlobalSettingsData>;
      if (parsed && typeof parsed === "object") {
        _state.tavily_api_key = parsed.tavily_api_key ?? "";
        _state.exa_api_key = parsed.exa_api_key ?? "";
        _state.scrapingdog_api_key = parsed.scrapingdog_api_key ?? "";
      }
    }
  } catch {
    /* ignore */
  }
}

function _saveToStorage(): void {
  try {
    localStorage.setItem(
      LS_GLOBAL_SETTINGS,
      JSON.stringify({
        tavily_api_key: _state.tavily_api_key,
        exa_api_key: _state.exa_api_key,
        scrapingdog_api_key: _state.scrapingdog_api_key,
      }),
    );
  } catch {
    /* storage quota */
  }
}

let _syncTimer: ReturnType<typeof setTimeout> | null = null;

function _scheduleSave(): void {
  if (_syncTimer !== null) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    _syncTimer = null;
    _saveToStorage();
    void fetch(apiUrl("/v1/user/settings"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tavily_api_key: _state.tavily_api_key,
        exa_api_key: _state.exa_api_key,
        scrapingdog_api_key: _state.scrapingdog_api_key,
      }),
    }).catch(() => {});
  }, 400);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the current global search API keys without Vue reactivity overhead.
 * Safe to call from outside components (e.g. buildAgentConfig in useChat.ts).
 */
export function getGlobalSearchKeys(): {
  tavily: string;
  exa: string;
  scrapingdog: string;
} {
  if (!_initialized) {
    _loadFromStorage();
    _initialized = true;
  }
  return {
    tavily: _state.tavily_api_key,
    exa: _state.exa_api_key,
    scrapingdog: _state.scrapingdog_api_key,
  };
}

export function useGlobalSettings() {
  if (!_initialized) {
    _loadFromStorage();
    _initialized = true;
  }

  function setKey(field: keyof GlobalSettingsData, value: string): void {
    _state[field] = value;
    _scheduleSave();
  }

  /**
   * Load from backend and merge: backend values win if they are non-empty.
   * Called once on app mount so the UI reflects server-side state.
   */
  async function loadFromBackend(): Promise<void> {
    try {
      const resp = await fetch(apiUrl("/v1/user/settings"));
      if (!resp.ok) return;
      const data = (await resp.json()) as Partial<GlobalSettingsData>;
      let changed = false;
      if (data.tavily_api_key) {
        _state.tavily_api_key = data.tavily_api_key;
        changed = true;
      }
      if (data.exa_api_key) {
        _state.exa_api_key = data.exa_api_key;
        changed = true;
      }
      if (data.scrapingdog_api_key) {
        _state.scrapingdog_api_key = data.scrapingdog_api_key;
        changed = true;
      }
      if (changed) _saveToStorage();
    } catch {
      /* no server reachable — rely on localStorage */
    }
  }

  return { state: _state, setKey, loadFromBackend };
}
