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

describe("useRegistries", () => {
  beforeEach(() => {
    apiMod.getRegistries.mockReset();
    apiMod.addRegistry.mockReset();
    apiMod.refreshRegistry.mockReset();
  });

  it("loads registries", async () => {
    apiMod.getRegistries.mockResolvedValue([
      { name: "official", url: "https://x", plugin_count: 3 },
    ]);
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.load();
    expect(state.registries.value).toHaveLength(1);
    expect(state.error.value).toBeNull();
  });

  it("rejects empty url/name without calling backend", async () => {
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("", "x");
    expect(result).toBeNull();
    expect(apiMod.addRegistry).not.toHaveBeenCalled();
    expect(state.error.value).toBe("Registry name and URL are required.");
  });

  it("appends added registry on success", async () => {
    apiMod.addRegistry.mockResolvedValue({ name: "new", url: "https://n" });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    const result = await state.add("https://n", "new");
    expect(result).not.toBeNull();
    expect(state.registries.value.find((r) => r.name === "new")).toBeTruthy();
  });

  it("surfaces backend body verbatim on add failure", async () => {
    apiMod.addRegistry.mockRejectedValue(
      new http.ApiError("HTTP 409", 409, "duplicate registry"),
    );
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.add("https://u", "dup");
    expect(state.error.value).toBe("duplicate registry");
  });

  it("merges refresh result into existing entry", async () => {
    apiMod.getRegistries.mockResolvedValue([
      { name: "r1", url: "https://r1", plugin_count: 1 },
    ]);
    apiMod.refreshRegistry.mockResolvedValue({
      name: "r1",
      url: "https://r1",
      plugin_count: 5,
    });
    const { useRegistries } = await import("./useRegistries");
    const state = useRegistries();
    await state.load();
    await state.refresh("r1");
    expect(state.registries.value[0].plugin_count).toBe(5);
  });
});
