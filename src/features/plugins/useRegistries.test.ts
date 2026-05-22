import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMod = vi.hoisted(() => ({
  getRegistries: vi.fn<() => Promise<unknown>>(),
  addRegistry: vi.fn<(url: string, name: string) => Promise<unknown>>(),
  refreshRegistry: vi.fn<(name: string) => Promise<unknown>>(),
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

describe("useRegistries.load", () => {
  beforeEach(() => {
    apiMod.getRegistries.mockReset();
  });

  it("populates registries on success", async () => {
    apiMod.getRegistries.mockResolvedValue([
      { name: "official", url: "https://x", plugin_count: 3 },
    ]);
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.load();
    expect(state.registries.value).toHaveLength(1);
    expect(state.registries.value[0].name).toBe("official");
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.loading.value).toBe(false);
  });

  it("flips loading to true during call and false when settled", async () => {
    let pendingResolve: ((value: unknown) => void) | null = null;
    apiMod.getRegistries.mockReturnValue(
      new Promise((resolve) => {
        pendingResolve = resolve;
      }),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const promise = state.load();
    expect(state.loading.value).toBe(true);
    pendingResolve!([]);
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("sets notImplemented=true and clears registries on 404", async () => {
    apiMod.getRegistries.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [{ name: "stale" } as never];
    await state.load();
    expect(state.notImplemented.value).toBe(true);
    expect(state.registries.value).toEqual([]);
    expect(state.error.value).toBeNull();
  });

  it("does not set notImplemented for non-404 ApiError, surfaces error message", async () => {
    apiMod.getRegistries.mockRejectedValue(new http.ApiError("HTTP 500", 500, "boom"));
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.load();
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toContain("boom");
  });

  it("does not set notImplemented for non-ApiError, falls back to default message", async () => {
    apiMod.getRegistries.mockRejectedValue(new Error("network down"));
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.load();
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toContain("network down");
  });

  it("clears previous error and notImplemented before new load", async () => {
    apiMod.getRegistries.mockResolvedValueOnce([]);
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.error.value = "previous";
    state.notImplemented.value = true;
    await state.load();
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});

describe("useRegistries.add", () => {
  beforeEach(() => {
    apiMod.addRegistry.mockReset();
  });

  it("rejects empty url without calling backend", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("", "name");
    expect(result).toBeNull();
    expect(apiMod.addRegistry).not.toHaveBeenCalled();
    expect(state.error.value).toBe("Registry name and URL are required.");
  });

  it("rejects empty name without calling backend", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("https://x", "");
    expect(result).toBeNull();
    expect(apiMod.addRegistry).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only inputs", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("   ", "   ");
    expect(result).toBeNull();
    expect(apiMod.addRegistry).not.toHaveBeenCalled();
  });

  it("trims url and name before calling backend", async () => {
    apiMod.addRegistry.mockResolvedValue({ name: "n", url: "u" });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.add("  https://x  ", "  fancy  ");
    expect(apiMod.addRegistry).toHaveBeenCalledWith("https://x", "fancy");
  });

  it("appends new registry on success", async () => {
    apiMod.addRegistry.mockResolvedValue({ name: "new", url: "https://n" });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [{ name: "existing", url: "https://e" } as never];
    const result = await state.add("https://n", "new");
    expect(result).not.toBeNull();
    const names = state.registries.value.map((r) => r.name);
    expect(names).toEqual(["existing", "new"]);
  });

  it("replaces entry with same name on success (de-duplicates)", async () => {
    apiMod.addRegistry.mockResolvedValue({
      name: "same",
      url: "https://fresh",
      plugin_count: 9,
    });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [
      { name: "same", url: "https://old", plugin_count: 1 } as never,
      { name: "other", url: "https://o" } as never,
    ];
    await state.add("https://fresh", "same");
    expect(state.registries.value).toHaveLength(2);
    const replaced = state.registries.value.find((r) => r.name === "same");
    expect(replaced?.url).toBe("https://fresh");
    expect(replaced?.plugin_count).toBe(9);
  });

  it("flips adding flag during call and back when settled", async () => {
    let resolveAdd: ((value: unknown) => void) | null = null;
    apiMod.addRegistry.mockReturnValue(
      new Promise((resolve) => {
        resolveAdd = resolve;
      }),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const promise = state.add("https://n", "n");
    expect(state.adding.value).toBe(true);
    resolveAdd!({ name: "n", url: "https://n" });
    await promise;
    expect(state.adding.value).toBe(false);
  });

  it("surfaces backend body verbatim on add failure", async () => {
    apiMod.addRegistry.mockRejectedValue(
      new http.ApiError("HTTP 409", 409, "duplicate registry"),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("https://u", "dup");
    expect(result).toBeNull();
    expect(state.error.value).toBe("duplicate registry");
  });
});

describe("useRegistries.refresh", () => {
  beforeEach(() => {
    apiMod.refreshRegistry.mockReset();
  });

  it("ignores empty name without calling backend", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.refresh("");
    expect(apiMod.refreshRegistry).not.toHaveBeenCalled();
  });

  it("merges refresh result into existing entry", async () => {
    apiMod.refreshRegistry.mockResolvedValue({
      name: "r1",
      url: "https://r1-new",
      plugin_count: 5,
    });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [
      { name: "r1", url: "https://r1", plugin_count: 1 } as never,
      { name: "r2", url: "https://r2", plugin_count: 2 } as never,
    ];
    await state.refresh("r1");
    expect(state.registries.value[0]).toMatchObject({
      name: "r1",
      url: "https://r1-new",
      plugin_count: 5,
    });
    expect(state.registries.value[1]).toMatchObject({ name: "r2", plugin_count: 2 });
  });

  it("flips refreshing[name] flag during call and removes when settled", async () => {
    let resolveRefresh: ((value: unknown) => void) | null = null;
    apiMod.refreshRegistry.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const promise = state.refresh("registry-x");
    expect(state.refreshing.value["registry-x"]).toBe(true);
    resolveRefresh!({ name: "registry-x" });
    await promise;
    expect(state.refreshing.value["registry-x"]).toBeUndefined();
  });

  it("surfaces error with name context on failure and keeps entries intact", async () => {
    apiMod.refreshRegistry.mockRejectedValue(
      new http.ApiError("HTTP 502", 502, "upstream offline"),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [{ name: "broken", url: "https://b" } as never];
    await state.refresh("broken");
    expect(state.error.value).toBe("upstream offline");
    expect(state.registries.value[0].name).toBe("broken");
  });

  it("removes only the failed name from refreshing map, keeps others", async () => {
    apiMod.refreshRegistry.mockRejectedValue(new Error("boom"));
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.refreshing.value = { other: true };
    await state.refresh("target");
    expect(state.refreshing.value.target).toBeUndefined();
    expect(state.refreshing.value.other).toBe(true);
  });
});

describe("useRegistries.reset", () => {
  it("resets every reactive field to initial state", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    state.registries.value = [{ name: "x" } as never];
    state.loading.value = true;
    state.error.value = "err";
    state.notImplemented.value = true;
    state.refreshing.value = { a: true };
    state.adding.value = true;
    state.reset();
    expect(state.registries.value).toEqual([]);
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.refreshing.value).toEqual({});
    expect(state.adding.value).toBe(false);
  });
});
