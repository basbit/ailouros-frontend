import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMod = vi.hoisted(() => ({
  searchPlugins: vi.fn<(q: string) => Promise<unknown>>(),
  installPlugin:
    vi.fn<(id: string, version: string, registry: string) => Promise<unknown>>(),
}));

const http = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    status: number;
    body?: string;
    constructor(message: string, status: number, body?: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
}));

vi.mock("@/shared/api/endpoints/plugins", () => apiMod);
vi.mock("@/shared/api/http", () => http);

afterEach(() => {
  vi.clearAllMocks();
});

describe("usePluginSearch.search", () => {
  beforeEach(() => {
    apiMod.searchPlugins.mockReset();
  });

  it("populates results from backend hits", async () => {
    apiMod.searchPlugins.mockResolvedValue([
      { id: "p1", name: "P1", version: "1.0.0", registry: "r" },
    ]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("p");
    expect(apiMod.searchPlugins).toHaveBeenCalledWith("p");
    expect(state.results.value).toHaveLength(1);
    expect(state.query.value).toBe("p");
  });

  it("updates query.value when q argument is a string", async () => {
    apiMod.searchPlugins.mockResolvedValue([]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("alpha");
    expect(state.query.value).toBe("alpha");
  });

  it("preserves existing query.value when q is undefined", async () => {
    apiMod.searchPlugins.mockResolvedValue([]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.query.value = "preset";
    await state.search();
    expect(state.query.value).toBe("preset");
    expect(apiMod.searchPlugins).toHaveBeenCalledWith("preset");
  });

  it("accepts empty string as explicit query", async () => {
    apiMod.searchPlugins.mockResolvedValue([]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.query.value = "old";
    await state.search("");
    expect(state.query.value).toBe("");
    expect(apiMod.searchPlugins).toHaveBeenCalledWith("");
  });

  it("flips loading to true during call and false when settled", async () => {
    let resolveSearch: ((value: unknown) => void) | null = null;
    apiMod.searchPlugins.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    const promise = state.search("q");
    expect(state.loading.value).toBe(true);
    resolveSearch!([]);
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("clears previous error and notImplemented before new search", async () => {
    apiMod.searchPlugins.mockResolvedValue([]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.error.value = "stale";
    state.notImplemented.value = true;
    await state.search("fresh");
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("flips notImplemented and clears results on ApiError 404", async () => {
    apiMod.searchPlugins.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.results.value = [{ id: "stale" } as never];
    await state.search("x");
    expect(state.notImplemented.value).toBe(true);
    expect(state.results.value).toEqual([]);
    expect(state.error.value).toBeNull();
  });

  it("uses body verbatim for non-404 ApiError with body present", async () => {
    apiMod.searchPlugins.mockRejectedValue(
      new http.ApiError("HTTP 500", 500, "internal failure"),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBe("internal failure");
  });

  it("falls back to ApiError.message when body is blank or missing", async () => {
    apiMod.searchPlugins.mockRejectedValue(new http.ApiError("HTTP 502: gateway", 502));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.error.value).toBe("HTTP 502: gateway");
  });

  it("treats whitespace-only ApiError body as missing and uses message", async () => {
    apiMod.searchPlugins.mockRejectedValue(
      new http.ApiError("HTTP 500 fallback", 500, "   "),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.error.value).toBe("HTTP 500 fallback");
  });

  it("surfaces plain Error.message", async () => {
    apiMod.searchPlugins.mockRejectedValue(new Error("network down"));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.error.value).toBe("network down");
  });

  it("uses generic message for non-Error throwables", async () => {
    apiMod.searchPlugins.mockRejectedValue("string throw");
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.error.value).toBe("Failed to search plugins.");
  });
});

describe("usePluginSearch.install", () => {
  beforeEach(() => {
    apiMod.installPlugin.mockReset();
  });

  it("returns null without IPC when hit.id is empty", async () => {
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    const result = await state.install({
      id: "",
      name: "X",
      version: "1",
      registry: "r",
    });
    expect(result).toBeNull();
    expect(apiMod.installPlugin).not.toHaveBeenCalled();
  });

  it("passes id, version and registry to installPlugin", async () => {
    apiMod.installPlugin.mockResolvedValue({ id: "p1", name: "P1", version: "1.0.0" });
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.install({ id: "p1", name: "P1", version: "1.0.0", registry: "reg-x" });
    expect(apiMod.installPlugin).toHaveBeenCalledWith("p1", "1.0.0", "reg-x");
  });

  it("returns installed manifest on success", async () => {
    const manifest = { id: "p1", name: "P1", version: "1.0.0" };
    apiMod.installPlugin.mockResolvedValue(manifest);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    const result = await state.install({
      id: "p1",
      name: "P1",
      version: "1.0.0",
      registry: "r",
    });
    expect(result).toEqual(manifest);
  });

  it("tracks per-id installing flag, sets true before call, deletes after settled", async () => {
    let resolveInstall: ((value: unknown) => void) | undefined;
    apiMod.installPlugin.mockImplementation(
      () => new Promise((resolve) => (resolveInstall = resolve)),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    const promise = state.install({
      id: "p1",
      name: "P1",
      version: "1.0.0",
      registry: "r",
    });
    expect(state.installing.value.get("p1")).toBe(true);
    resolveInstall?.({ id: "p1", name: "P1", version: "1.0.0" });
    await promise;
    expect(state.installing.value.get("p1")).toBeUndefined();
  });

  it("removes only the installed id from installing map on failure, keeps others", async () => {
    apiMod.installPlugin.mockRejectedValue(new Error("boom"));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.installing.value = new Map([["other", true]]);
    await state.install({ id: "p1", name: "P1", version: "1", registry: "r" });
    expect(state.installing.value.get("p1")).toBeUndefined();
    expect(state.installing.value.get("other")).toBe(true);
  });

  it("clears existing error before each install", async () => {
    apiMod.installPlugin.mockResolvedValue({ id: "p1", name: "P1", version: "1" });
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.error.value = "previous";
    await state.install({ id: "p1", name: "P1", version: "1", registry: "r" });
    expect(state.error.value).toBeNull();
  });

  it("surfaces backend body verbatim on ApiError with body", async () => {
    apiMod.installPlugin.mockRejectedValue(
      new http.ApiError("HTTP 422", 422, "signature mismatch"),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    const result = await state.install({
      id: "p1",
      name: "P1",
      version: "1.0.0",
      registry: "r",
    });
    expect(result).toBeNull();
    expect(state.error.value).toBe("signature mismatch");
  });

  it("falls back to ApiError.message when body is blank", async () => {
    apiMod.installPlugin.mockRejectedValue(
      new http.ApiError("HTTP 403 forbidden", 403),
    );
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.install({ id: "p1", name: "P1", version: "1", registry: "r" });
    expect(state.error.value).toBe("HTTP 403 forbidden");
  });

  it("uses install-specific fallback message for non-Error throwables", async () => {
    apiMod.installPlugin.mockRejectedValue("nope");
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.install({ id: "plugin-y", name: "Y", version: "1", registry: "r" });
    expect(state.error.value).toBe("Failed to install plugin-y.");
  });

  it("surfaces plain Error.message", async () => {
    apiMod.installPlugin.mockRejectedValue(new Error("connection refused"));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.install({ id: "p1", name: "P1", version: "1", registry: "r" });
    expect(state.error.value).toBe("connection refused");
  });
});

describe("usePluginSearch.reset", () => {
  it("clears every field including installing map", async () => {
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    state.query.value = "x";
    state.results.value = [{ id: "y" } as never];
    state.loading.value = true;
    state.error.value = "err";
    state.notImplemented.value = true;
    state.installing.value = new Map([["a", true]]);
    state.reset();
    expect(state.query.value).toBe("");
    expect(state.results.value).toEqual([]);
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.installing.value.size).toBe(0);
  });
});
