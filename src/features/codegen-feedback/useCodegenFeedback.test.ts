import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const feedbackApi = vi.hoisted(() => ({
  submitCodegenFeedback:
    vi.fn<(payload: unknown) => Promise<{ id: string; recorded_at: string }>>(),
}));

vi.mock("@/shared/api/endpoints/feedback", () => feedbackApi);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useCodegenFeedback", () => {
  beforeEach(() => {
    feedbackApi.submitCodegenFeedback.mockReset();
  });

  it("returns submission id on success", async () => {
    feedbackApi.submitCodegenFeedback.mockResolvedValue({
      id: "test-uuid",
      recorded_at: "2026-01-01T00:00:00Z",
    });
    const { useCodegenFeedback } = await import("./useCodegenFeedback");
    const state = useCodegenFeedback();
    const id = await state.submit({
      spec_id: "auth/login",
      agent: "coder",
      target_file: "src/auth/login.py",
      verdict: "accept",
    });
    expect(id).toBe("test-uuid");
    expect(state.lastSubmissionId.value).toBe("test-uuid");
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
  });

  it("records error without throwing on failure", async () => {
    feedbackApi.submitCodegenFeedback.mockRejectedValue(new Error("server down"));
    const { useCodegenFeedback } = await import("./useCodegenFeedback");
    const state = useCodegenFeedback();
    const id = await state.submit({
      spec_id: "s",
      agent: "a",
      target_file: "f.py",
      verdict: "reject",
    });
    expect(id).toBeNull();
    expect(state.error.value).toBe("server down");
    expect(state.loading.value).toBe(false);
  });

  it("sets loading true during fetch and false after", async () => {
    let resolveFn!: (v: { id: string; recorded_at: string }) => void;
    feedbackApi.submitCodegenFeedback.mockReturnValue(
      new Promise((resolve) => {
        resolveFn = resolve;
      }),
    );
    const { useCodegenFeedback } = await import("./useCodegenFeedback");
    const state = useCodegenFeedback();
    const promise = state.submit({
      spec_id: "s",
      agent: "a",
      target_file: "f.py",
      verdict: "accept",
    });
    expect(state.loading.value).toBe(true);
    resolveFn({ id: "done", recorded_at: "2026-01-01T00:00:00Z" });
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("clears error on each new submit attempt", async () => {
    feedbackApi.submitCodegenFeedback.mockRejectedValueOnce(new Error("first error"));
    feedbackApi.submitCodegenFeedback.mockResolvedValueOnce({
      id: "ok",
      recorded_at: "2026-01-01T00:00:00Z",
    });
    const { useCodegenFeedback } = await import("./useCodegenFeedback");
    const state = useCodegenFeedback();
    await state.submit({
      spec_id: "s",
      agent: "a",
      target_file: "f.py",
      verdict: "reject",
    });
    expect(state.error.value).toBe("first error");
    await state.submit({
      spec_id: "s",
      agent: "a",
      target_file: "f.py",
      verdict: "accept",
    });
    expect(state.error.value).toBeNull();
  });

  it("calls submitCodegenFeedback with correct payload including tags", async () => {
    feedbackApi.submitCodegenFeedback.mockResolvedValue({
      id: "t1",
      recorded_at: "2026-01-01T00:00:00Z",
    });
    const { useCodegenFeedback } = await import("./useCodegenFeedback");
    const state = useCodegenFeedback();
    await state.submit({
      spec_id: "auth/login",
      agent: "reviewer",
      target_file: "src/auth/login.py",
      verdict: "edit",
      user_edit_diff: "@@ -1 +1 @@\n-old\n+new",
      reason: "minor fix",
      tags: ["auth", "login"],
    });
    expect(feedbackApi.submitCodegenFeedback).toHaveBeenCalledWith({
      spec_id: "auth/login",
      agent: "reviewer",
      target_file: "src/auth/login.py",
      verdict: "edit",
      user_edit_diff: "@@ -1 +1 @@\n-old\n+new",
      reason: "minor fix",
      tags: ["auth", "login"],
    });
  });
});
