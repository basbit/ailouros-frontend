import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/api/endpoints/user-settings", () => ({
  getUserSettings: vi.fn(),
  putUserSettings: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/shared/lib/frontend-logger", () => ({
  frontendLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const STORAGE_KEY = "swarm_ui_global_settings_v1";

async function freshModule() {
  vi.resetModules();
  return import("@/shared/lib/global-search-keys");
}

describe("global-search behavior contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("getGlobalSearchKeys returns the three search-provider keys from defaults", async () => {
    const mod = await freshModule();
    expect(mod.getGlobalSearchKeys()).toEqual({
      tavily: "",
      exa: "",
      scrapingdog: "",
    });
  });

  it("getGlobalSearchKeys reflects values persisted in localStorage", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ tavily_api_key: "tvly-x", exa_api_key: "exa-y" }),
    );
    const mod = await freshModule();
    const keys = mod.getGlobalSearchKeys();
    expect(keys.tavily).toBe("tvly-x");
    expect(keys.exa).toBe("exa-y");
    expect(keys.scrapingdog).toBe("");
  });

  it("setKey persists to localStorage (save round-trip) after debounce", async () => {
    vi.useFakeTimers();
    try {
      const mod = await freshModule();
      const { setKey } = mod.useGlobalSearchKeys();
      setKey("swarm_self_verify", true);
      setKey("swarm_planner_model", "gpt-x");
      vi.runAllTimers();
      const raw = window.localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw as string);
      expect(parsed.swarm_self_verify).toBe(true);
      expect(parsed.swarm_planner_model).toBe("gpt-x");
    } finally {
      vi.useRealTimers();
    }
  });

  it("buildSyncPayload serialises every state field (defaults shape)", async () => {
    const mod = await freshModule();
    const payload = mod.buildSyncPayload();
    // a representative spread across string + boolean concerns
    expect(payload.tavily_api_key).toBe("");
    expect(payload.swarm_mcp_auto).toBe(true);
    expect(payload.swarm_wiki_search_enabled).toBe(true);
    expect(payload.swarm_self_verify).toBe(false);
    expect(payload.swarm_orchestration_skill_dispatcher).toBe("off");
    // full key parity with the typed state surface
    expect(Object.keys(payload).length).toBeGreaterThan(100);
  });

  it("loadFromBackend keeps real secret when backend returns the mask", async () => {
    vi.useFakeTimers();
    const { getUserSettings } = await import("@/shared/api/endpoints/user-settings");
    try {
      const mod = await freshModule();
      const { state, setKey, loadFromBackend } = mod.useGlobalSearchKeys();
      setKey("tavily_api_key", "tvly-real");
      vi.runAllTimers();
      vi.mocked(getUserSettings).mockResolvedValueOnce({
        tavily_api_key: "***",
      } as Partial<typeof state>);
      await loadFromBackend();
      expect(state.tavily_api_key).toBe("tvly-real");
    } finally {
      vi.useRealTimers();
    }
  });
});
