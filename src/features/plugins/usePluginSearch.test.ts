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

describe("usePluginSearch", () => {
  beforeEach(() => {
    apiMod.searchPlugins.mockReset();
    apiMod.installPlugin.mockReset();
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

  it("flips notImplemented on 404", async () => {
    apiMod.searchPlugins.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("x");
    expect(state.notImplemented.value).toBe(true);
    expect(state.error.value).toBeNull();
  });

  it("tracks per-id installing flags", async () => {
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

  it("surfaces backend error verbatim on install failure", async () => {
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

  it("reset clears query and results", async () => {
    apiMod.searchPlugins.mockResolvedValue([
      { id: "p1", name: "P1", version: "1.0.0", registry: "r" },
    ]);
    const { usePluginSearch } = await import("./usePluginSearch");
    const state = usePluginSearch();
    await state.search("p");
    state.reset();
    expect(state.query.value).toBe("");
    expect(state.results.value).toEqual([]);
  });
});
