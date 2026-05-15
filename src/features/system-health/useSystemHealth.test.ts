import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope } from "vue";

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

describe("useSystemHealth", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("loads aggregate status and subsystems", async () => {
    http.httpGet.mockResolvedValue({
      status: "degraded",
      subsystems: [
        {
          subsystem: "redis",
          status: "degraded",
          latency_ms: 1.2,
          detail: "AOF off",
          metadata: { url: "redis://x" },
        },
      ],
    });
    const { useSystemHealth } = await import("./useSystemHealth");
    const scope = effectScope();
    await scope.run(async () => {
      const state = useSystemHealth(0);
      await state.reload();
      expect(http.httpGet).toHaveBeenCalledWith("/v1/health", expect.anything());
      expect(state.status.value).toBe("degraded");
      expect(state.subsystems.value).toHaveLength(1);
      expect(state.subsystems.value[0].subsystem).toBe("redis");
      expect(state.notImplemented.value).toBe(false);
      expect(state.error.value).toBeNull();
      expect(state.lastUpdatedAt.value).toBeTypeOf("number");
    });
    scope.stop();
  });

  it("fills missing subsystems with empty array", async () => {
    http.httpGet.mockResolvedValue({ status: "ok" });
    const { useSystemHealth } = await import("./useSystemHealth");
    const scope = effectScope();
    await scope.run(async () => {
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.subsystems.value).toEqual([]);
      expect(state.status.value).toBe("ok");
    });
    scope.stop();
  });

  it("flips notImplemented on 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSystemHealth } = await import("./useSystemHealth");
    const scope = effectScope();
    await scope.run(async () => {
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.notImplemented.value).toBe(true);
      expect(state.status.value).toBeNull();
      expect(state.error.value).toBeNull();
    });
    scope.stop();
  });

  it("surfaces non-404 errors as message", async () => {
    http.httpGet.mockRejectedValue(new Error("network down"));
    const { useSystemHealth } = await import("./useSystemHealth");
    const scope = effectScope();
    await scope.run(async () => {
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.error.value).toBe("network down");
      expect(state.notImplemented.value).toBe(false);
    });
    scope.stop();
  });

  it("reset() clears state and stops polling", async () => {
    vi.useFakeTimers();
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    const { useSystemHealth } = await import("./useSystemHealth");
    const scope = effectScope();
    await scope.run(async () => {
      const state = useSystemHealth(1000);
      await state.reload();
      expect(state.status.value).toBe("ok");
      state.reset();
      expect(state.status.value).toBeNull();
      expect(state.subsystems.value).toEqual([]);
      expect(state.lastUpdatedAt.value).toBeNull();
      vi.advanceTimersByTime(5000);
      expect(http.httpGet).toHaveBeenCalledTimes(1);
    });
    scope.stop();
    vi.useRealTimers();
  });
});
