import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn<(path: string) => Promise<unknown>>(),
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

describe("useConversationHistory.load — happy paths", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("hydrates messages and flag when the endpoint returns 200", async () => {
    http.httpGet.mockResolvedValue({
      task_id: "t1",
      messages: [
        {
          id: "m1",
          task_id: "t1",
          role: "user",
          content: "hi",
          created_at: "2026-05-14T10:00:00Z",
        },
      ],
      shared_history_enabled: true,
    });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(http.httpGet).toHaveBeenCalledWith("/v1/conversation/t1");
    expect(state.messages.value).toHaveLength(1);
    expect(state.sharedHistoryEnabled.value).toBe(true);
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.loading.value).toBe(false);
  });

  it("URL-encodes taskId in the endpoint path", async () => {
    http.httpGet.mockResolvedValue({ messages: [] });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("task id/slash");
    expect(http.httpGet).toHaveBeenCalledWith("/v1/conversation/task%20id%2Fslash");
  });

  it("defaults messages to [] when payload omits the field", async () => {
    http.httpGet.mockResolvedValue({ shared_history_enabled: false });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.messages.value).toEqual([]);
    expect(state.sharedHistoryEnabled.value).toBe(false);
  });

  it("sets sharedHistoryEnabled to null when payload omits the field", async () => {
    http.httpGet.mockResolvedValue({ messages: [] });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.sharedHistoryEnabled.value).toBeNull();
  });

  it("sets sharedHistoryEnabled to null when payload has non-boolean value", async () => {
    http.httpGet.mockResolvedValue({ messages: [], shared_history_enabled: "yes" });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.sharedHistoryEnabled.value).toBeNull();
  });

  it("flips loading flag during call and back when settled", async () => {
    let resolveCall: ((value: unknown) => void) | null = null;
    http.httpGet.mockReturnValue(
      new Promise((resolve) => {
        resolveCall = resolve;
      }),
    );
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    const promise = state.load("t1");
    await vi.waitFor(() => expect(resolveCall).not.toBeNull());
    expect(state.loading.value).toBe(true);
    resolveCall!({ messages: [] });
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("clears previous error and notImplemented before each load", async () => {
    http.httpGet.mockResolvedValueOnce({ messages: [] });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    state.error.value = "previous";
    state.notImplemented.value = true;
    await state.load("t1");
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});

describe("useConversationHistory.load — input validation", () => {
  it("ignores empty task ids without making an HTTP call", async () => {
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("");
    expect(http.httpGet).not.toHaveBeenCalled();
    expect(state.loading.value).toBe(false);
  });
});

describe("useConversationHistory.load — error handling", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("flips notImplemented when the endpoint returns 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    state.messages.value = [{ id: "stale" } as never];
    state.sharedHistoryEnabled.value = true;
    await state.load("t1");
    expect(state.notImplemented.value).toBe(true);
    expect(state.messages.value).toEqual([]);
    expect(state.sharedHistoryEnabled.value).toBeNull();
    expect(state.error.value).toBeNull();
  });

  it("does not set notImplemented on non-404 ApiError, surfaces message", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 500 down", 500));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBe("HTTP 500 down");
  });

  it("does not set notImplemented on plain Error matching 404 status property", async () => {
    http.httpGet.mockRejectedValue({ status: 404 });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBe("Failed to load conversation history.");
  });

  it("surfaces plain Error.message for non-Api failures", async () => {
    http.httpGet.mockRejectedValue(new Error("network outage"));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.error.value).toBe("network outage");
    expect(state.notImplemented.value).toBe(false);
  });

  it("uses generic message for non-Error throwables", async () => {
    http.httpGet.mockRejectedValue("string thrown");
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.error.value).toBe("Failed to load conversation history.");
  });

  it("clears loading flag in finally block even on error", async () => {
    http.httpGet.mockRejectedValue(new Error("boom"));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.loading.value).toBe(false);
  });
});

describe("useConversationHistory.reset", () => {
  it("clears every field back to initial state", async () => {
    http.httpGet.mockResolvedValue({
      messages: [{ id: "m1" } as never],
      shared_history_enabled: true,
    });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    state.error.value = "err";
    state.notImplemented.value = true;
    state.reset();
    expect(state.messages.value).toEqual([]);
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.sharedHistoryEnabled.value).toBeNull();
  });
});
