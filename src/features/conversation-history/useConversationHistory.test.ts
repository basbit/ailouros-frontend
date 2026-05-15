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

describe("useConversationHistory", () => {
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
  });

  it("flips notImplemented when the endpoint returns 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.notImplemented.value).toBe(true);
    expect(state.messages.value).toHaveLength(0);
    expect(state.error.value).toBeNull();
  });

  it("populates error on other failures", async () => {
    http.httpGet.mockRejectedValue(new Error("network"));
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    expect(state.error.value).toBe("network");
    expect(state.notImplemented.value).toBe(false);
  });

  it("ignores empty task ids", async () => {
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("");
    expect(http.httpGet).not.toHaveBeenCalled();
  });

  it("reset clears state", async () => {
    http.httpGet.mockResolvedValue({ task_id: "t1", messages: [] });
    const { useConversationHistory } = await import("./useConversationHistory");
    const state = useConversationHistory();
    await state.load("t1");
    state.reset();
    expect(state.messages.value).toEqual([]);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(state.sharedHistoryEnabled.value).toBeNull();
  });
});
