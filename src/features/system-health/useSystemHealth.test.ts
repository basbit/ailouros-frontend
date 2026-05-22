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

async function withScope<T>(fn: () => Promise<T>): Promise<T> {
  const scope = effectScope();
  try {
    return (await scope.run(fn)) as T;
  } finally {
    scope.stop();
  }
}

describe("useSystemHealth.reload — happy paths", () => {
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
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
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
  });

  it("defaults status to 'ok' when payload omits it", async () => {
    http.httpGet.mockResolvedValue({ subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.status.value).toBe("ok");
    });
  });

  it("defaults subsystems to [] when payload omits the field", async () => {
    http.httpGet.mockResolvedValue({ status: "ok" });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.subsystems.value).toEqual([]);
    });
  });

  it("treats non-array subsystems as []", async () => {
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: "not-an-array" });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.subsystems.value).toEqual([]);
    });
  });

  it("flips loading during call and clears it when settled", async () => {
    let resolveCall: ((value: unknown) => void) | null = null;
    http.httpGet.mockReturnValue(
      new Promise((resolve) => {
        resolveCall = resolve;
      }),
    );
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      const promise = state.reload();
      expect(state.loading.value).toBe(true);
      resolveCall!({ status: "ok", subsystems: [] });
      await promise;
      expect(state.loading.value).toBe(false);
    });
  });

  it("clears stale error before reload and refreshes lastUpdatedAt", async () => {
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      state.error.value = "previous";
      const before = state.lastUpdatedAt.value;
      await state.reload();
      expect(state.error.value).toBeNull();
      expect(state.lastUpdatedAt.value).not.toBe(before);
    });
  });

  it("toggles notImplemented back to false after a successful reload", async () => {
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      state.notImplemented.value = true;
      await state.reload();
      expect(state.notImplemented.value).toBe(false);
    });
  });
});

describe("useSystemHealth.reload — error handling", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("flips notImplemented and clears status/subsystems on 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      state.status.value = "ok";
      state.subsystems.value = [{ subsystem: "stale" } as never];
      await state.reload();
      expect(state.notImplemented.value).toBe(true);
      expect(state.status.value).toBeNull();
      expect(state.subsystems.value).toEqual([]);
      expect(state.error.value).toBeNull();
    });
  });

  it("treats non-404 ApiError as Error.message", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 500: down", 500));
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.notImplemented.value).toBe(false);
      expect(state.error.value).toBe("HTTP 500: down");
    });
  });

  it("surfaces plain Error.message", async () => {
    http.httpGet.mockRejectedValue(new Error("network down"));
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.error.value).toBe("network down");
    });
  });

  it("uses generic message for non-Error throwables", async () => {
    http.httpGet.mockRejectedValue("string thrown");
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.error.value).toBe("Failed to load health.");
    });
  });

  it("clears loading flag in finally block even on error", async () => {
    http.httpGet.mockRejectedValue(new Error("boom"));
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(0);
      await state.reload();
      expect(state.loading.value).toBe(false);
    });
  });
});

describe("useSystemHealth — polling", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("does not start interval polling when intervalMs <= 0", async () => {
    vi.useFakeTimers();
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      useSystemHealth(0);
      vi.advanceTimersByTime(60_000);
      expect(http.httpGet).not.toHaveBeenCalled();
    });
    vi.useRealTimers();
  });

  it("triggers reload at every interval tick", async () => {
    vi.useFakeTimers();
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      useSystemHealth(500);
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      expect(http.httpGet).toHaveBeenCalledTimes(2);
    });
    vi.useRealTimers();
  });

  it("stopPolling halts subsequent interval ticks", async () => {
    vi.useFakeTimers();
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(500);
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      state.stopPolling();
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
      expect(http.httpGet).toHaveBeenCalledTimes(1);
    });
    vi.useRealTimers();
  });

  it("stopPolling is idempotent", async () => {
    vi.useFakeTimers();
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(500);
      state.stopPolling();
      state.stopPolling();
    });
    vi.useRealTimers();
  });
});

describe("useSystemHealth.reset", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("clears every field and stops polling", async () => {
    vi.useFakeTimers();
    http.httpGet.mockResolvedValue({ status: "ok", subsystems: [] });
    await withScope(async () => {
      const { useSystemHealth } = await import("./useSystemHealth");
      const state = useSystemHealth(1000);
      await state.reload();
      expect(state.status.value).toBe("ok");
      state.reset();
      expect(state.status.value).toBeNull();
      expect(state.subsystems.value).toEqual([]);
      expect(state.loading.value).toBe(false);
      expect(state.error.value).toBeNull();
      expect(state.notImplemented.value).toBe(false);
      expect(state.lastUpdatedAt.value).toBeNull();
      vi.advanceTimersByTime(5000);
      expect(http.httpGet).toHaveBeenCalledTimes(1);
    });
    vi.useRealTimers();
  });
});
