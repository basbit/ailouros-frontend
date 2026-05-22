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

describe("useInstalledPlugins.load", () => {
  beforeEach(() => {
    apiMod.getInstalledPlugins.mockReset();
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
    expect(state.loading.value).toBe(false);
  });

  it("flips loading to true during call and false when settled", async () => {
    let resolveLoad: ((value: unknown) => void) | null = null;
    apiMod.getInstalledPlugins.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    const promise = state.load();
    await vi.waitFor(() => expect(resolveLoad).not.toBeNull());
    expect(state.loading.value).toBe(true);
    resolveLoad!([]);
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("flips notImplemented on 404 and clears installedPlugins", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.installedPlugins.value = [{ id: "stale" } as never];
    await state.load();
    expect(state.notImplemented.value).toBe(true);
    expect(state.installedPlugins.value).toEqual([]);
    expect(state.error.value).toBeNull();
  });

  it("does not flip notImplemented for non-404 ApiError; surfaces body verbatim", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue(
      new http.ApiError("HTTP 500", 500, "registry corrupted"),
    );
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBe("registry corrupted");
  });

  it("falls back to default message for non-ApiError throwables", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue("not an error");
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.error.value).toBe("Failed to load installed plugins.");
  });

  it("surfaces plain Error.message", async () => {
    apiMod.getInstalledPlugins.mockRejectedValue(new Error("network outage"));
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    expect(state.error.value).toBe("network outage");
  });

  it("clears stale error and notImplemented at the start of each load", async () => {
    apiMod.getInstalledPlugins.mockResolvedValue([]);
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.error.value = "previous";
    state.notImplemented.value = true;
    await state.load();
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});

describe("useInstalledPlugins.uninstall", () => {
  beforeEach(() => {
    apiMod.getInstalledPlugins.mockReset();
    apiMod.uninstallPlugin.mockReset();
  });

  it("ignores empty id without calling backend", async () => {
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.uninstall("");
    expect(apiMod.uninstallPlugin).not.toHaveBeenCalled();
  });

  it("removes the plugin after successful uninstall", async () => {
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

  it("marks uninstalling[id] true during call, removes when settled", async () => {
    let resolveUninstall: (() => void) | null = null;
    apiMod.uninstallPlugin.mockImplementation(
      () => new Promise<void>((resolve) => (resolveUninstall = resolve)),
    );
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.installedPlugins.value = [{ id: "p1", name: "P1", version: "1" } as never];
    const promise = state.uninstall("p1");
    await vi.waitFor(() => expect(resolveUninstall).not.toBeNull());
    expect(state.uninstalling.value.p1).toBe(true);
    resolveUninstall!();
    await promise;
    expect(state.uninstalling.value.p1).toBeUndefined();
  });

  it("removes only the failed id from uninstalling map, keeps others", async () => {
    apiMod.uninstallPlugin.mockRejectedValue(new Error("permission denied"));
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.uninstalling.value = { other: true };
    await state.uninstall("p1");
    expect(state.uninstalling.value.p1).toBeUndefined();
    expect(state.uninstalling.value.other).toBe(true);
  });

  it("preserves installedPlugins on failure and surfaces error", async () => {
    apiMod.getInstalledPlugins.mockResolvedValue([
      { id: "p1", name: "P1", version: "1.0.0" },
    ]);
    apiMod.uninstallPlugin.mockRejectedValue(
      new http.ApiError("HTTP 409", 409, "in use"),
    );
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.load();
    await state.uninstall("p1");
    expect(state.installedPlugins.value).toHaveLength(1);
    expect(state.error.value).toBe("in use");
  });

  it("uses uninstall-specific fallback message for non-Error throwables", async () => {
    apiMod.uninstallPlugin.mockRejectedValue("nope");
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    await state.uninstall("plugin-x");
    expect(state.error.value).toBe("Failed to uninstall plugin-x.");
  });

  it("clears stale error before each uninstall", async () => {
    apiMod.uninstallPlugin.mockResolvedValue(undefined);
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.error.value = "previous";
    await state.uninstall("p1");
    expect(state.error.value).toBeNull();
  });
});

describe("useInstalledPlugins.reset", () => {
  it("clears every field back to initial state", async () => {
    const { useInstalledPlugins } = await import("./useInstalledPlugins");
    const state = useInstalledPlugins();
    state.installedPlugins.value = [{ id: "x" } as never];
    state.loading.value = true;
    state.error.value = "err";
    state.notImplemented.value = true;
    state.uninstalling.value = { x: true };
    state.reset();
    expect(state.installedPlugins.value).toEqual([]);
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.uninstalling.value).toEqual({});
  });
});
