import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMod = vi.hoisted(() => ({
  getInstalledPlugins: vi.fn<() => Promise<unknown>>(),
  uninstallPlugin: vi.fn<(id: string) => Promise<void>>(),
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

describe("useInstalledPlugins", () => {
  beforeEach(() => {
    apiMod.getInstalledPlugins.mockReset();
    apiMod.uninstallPlugin.mockReset();
  });

  it("hydrates plugins on load", async () => {
    apiMod.getInstalledPlugins.mockResolvedValue([
      { id: "p1", name: "Plugin One", version: "1.0.0" },
    ]);
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.installedPlugins.value).toHaveLength(1);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("flips notImplemented on 404", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.notImplemented.value).toBe(true);
    expect(state.installedPlugins.value).toHaveLength(0);
    expect(state.error.value).toBeNull();
  });

  it("surfaces backend error body verbatim on non-404", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue(
      new http.ApiError("HTTP 500", 500, "registry corrupted"),
    );
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.error.value).toBe("registry corrupted");
  });

  it("removes plugin after successful uninstall", async () => {
    apiMod.getInstalledPlugins.mockResolvedValue([
      { id: "p1", name: "One", version: "1.0.0" },
      { id: "p2", name: "Two", version: "2.0.0" },
    ]);
    apiMod.uninstallPlugin.mockResolvedValue(undefined);
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    await state.uninstall("p1");
    expect(state.installedPlugins.value.map((p) => p.id)).toEqual(["p2"]);
    expect(state.uninstalling.value.p1).toBeUndefined();
  });

  it("reset clears state", async () => {
    apiMod.getInstalledPlugins.mockResolvedValue([
      { id: "p1", name: "One", version: "1.0.0" },
    ]);
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    state.reset();
    expect(state.installedPlugins.value).toEqual([]);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});
