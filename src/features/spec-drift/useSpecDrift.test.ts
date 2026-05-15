import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn<(path: string) => Promise<unknown>>(),
  httpPost: vi.fn<(path: string) => Promise<unknown>>(),
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

vi.mock("@/shared/api/http", () => http);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSpecDrift", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
    http.httpPost.mockReset();
  });

  it("loads and normalises a drift report", async () => {
    http.httpGet.mockResolvedValue({
      stale_code: [{ spec_id: "spec-1", path: "src/a.ts", reason: "hash mismatch" }],
      stale_specs: [],
      aged_keep_regions: [{ path: "src/b.ts", line: 12, age_days: 90 }],
    });
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    await state.load("/workspace");
    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/drift?workspace_root=%2Fworkspace",
    );
    expect(state.report.value).not.toBeNull();
    expect(state.report.value?.stale_code).toHaveLength(1);
    expect(state.report.value?.stale_specs).toEqual([]);
    expect(state.report.value?.aged_keep_regions[0].age_days).toBe(90);
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBeNull();
  });

  it("fills missing arrays with empty defaults", async () => {
    http.httpGet.mockResolvedValue({});
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    await state.load("/workspace");
    expect(state.report.value).toEqual({
      stale_code: [],
      stale_specs: [],
      aged_keep_regions: [],
    });
  });

  it("flips notImplemented on 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    await state.load("/workspace");
    expect(state.notImplemented.value).toBe(true);
    expect(state.report.value).toBeNull();
    expect(state.error.value).toBeNull();
  });

  it("surfaces non-404 failures as error message", async () => {
    http.httpGet.mockRejectedValue(new Error("server down"));
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    await state.load("/workspace");
    expect(state.error.value).toBe("server down");
    expect(state.notImplemented.value).toBe(false);
  });

  it("regenerate posts to the generate endpoint and tracks the last outcome", async () => {
    http.httpPost.mockResolvedValue({
      spec_id: "spec-1",
      written_files: ["src/a.ts"],
      sidecar_paths: ["src/.specs/a.json"],
      retry_count: 0,
    });
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    const outcome = await state.regenerate("spec-1");
    expect(http.httpPost).toHaveBeenCalledWith("/v1/spec/spec-1/generate");
    expect(outcome?.written_files).toEqual(["src/a.ts"]);
    expect(state.lastOutcome.value?.spec_id).toBe("spec-1");
    expect(state.regenerateError.value).toBeNull();
    expect(state.regenerating.value).toEqual({});
  });

  it("records regenerate failures without throwing", async () => {
    http.httpPost.mockRejectedValue(new Error("model timeout"));
    const { useSpecDrift } = await import("./useSpecDrift");
    const state = useSpecDrift();
    const outcome = await state.regenerate("spec-2");
    expect(outcome).toBeNull();
    expect(state.regenerateError.value).toBe("model timeout");
    expect(state.regenerating.value).toEqual({});
  });
});
