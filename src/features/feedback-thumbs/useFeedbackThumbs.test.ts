import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GoldenCandidate, RetrievalFeedback } from "@/entities/retrieval-feedback";

import { resetFeedbackThumbs, useFeedbackThumbs } from "./useFeedbackThumbs";

const submitMock =
  vi.fn<(input: Record<string, unknown>) => Promise<RetrievalFeedback>>();
const promoteMock =
  vi.fn<
    (
      feedbackId: string,
      workspaceRoot: string,
    ) => Promise<{ candidate: GoldenCandidate; appendedTo: string | null }>
  >();

vi.mock("@/shared/api/endpoints/retrieval-feedback", () => ({
  submitRetrievalFeedback: (input: Record<string, unknown>) => submitMock(input),
  promoteFeedbackToGolden: (id: string, root: string) => promoteMock(id, root),
}));

function makeRecord(overrides: Partial<RetrievalFeedback> = {}): RetrievalFeedback {
  return {
    feedbackId: "fb-abc",
    kind: "thumbs_up",
    query: "q",
    answer: "a",
    chunkIds: ["wiki/auth#login"],
    rationale: "good",
    scenario: "wiki",
    createdAt: 1700000000,
    ...overrides,
  };
}

describe("useFeedbackThumbs", () => {
  beforeEach(() => {
    resetFeedbackThumbs();
    submitMock.mockReset();
    promoteMock.mockReset();
  });

  it("submit stores the record and clears the error", async () => {
    submitMock.mockResolvedValue(makeRecord());
    const thumbs = useFeedbackThumbs();
    const record = await thumbs.submit({
      workspaceRoot: "/tmp/w",
      kind: "thumbs_up",
      query: "q",
    });
    expect(record?.feedbackId).toBe("fb-abc");
    expect(thumbs.records.value).toHaveLength(1);
    expect(thumbs.lastError.value).toBeNull();
  });

  it("submit returns null and surfaces error message on failure", async () => {
    submitMock.mockRejectedValue(new Error("503 unavailable"));
    const thumbs = useFeedbackThumbs();
    const record = await thumbs.submit({
      workspaceRoot: "/tmp/w",
      kind: "thumbs_up",
      query: "q",
    });
    expect(record).toBeNull();
    expect(thumbs.lastError.value).toBe("503 unavailable");
    expect(thumbs.records.value).toEqual([]);
  });

  it("submit toggles the submitting flag", async () => {
    let resolveLater: ((value: RetrievalFeedback) => void) | null = null;
    submitMock.mockReturnValue(
      new Promise<RetrievalFeedback>((res) => {
        resolveLater = res;
      }),
    );
    const thumbs = useFeedbackThumbs();
    const promise = thumbs.submit({
      workspaceRoot: "/tmp/w",
      kind: "thumbs_up",
      query: "q",
    });
    expect(thumbs.submitting.value).toBe(true);
    resolveLater!(makeRecord());
    await promise;
    expect(thumbs.submitting.value).toBe(false);
  });

  it("records stack newest-first and stay capped", async () => {
    const thumbs = useFeedbackThumbs();
    for (let i = 0; i < 40; i += 1) {
      submitMock.mockResolvedValueOnce(makeRecord({ feedbackId: `fb-${i}` }));
      await thumbs.submit({
        workspaceRoot: "/tmp/w",
        kind: "thumbs_up",
        query: "q",
      });
    }
    expect(thumbs.records.value.length).toBeLessThanOrEqual(32);
    expect(thumbs.records.value[0]?.feedbackId).toBe("fb-39");
  });

  it("promoteToGolden surfaces the appended_to path and the candidate", async () => {
    promoteMock.mockResolvedValue({
      candidate: {
        query: "q",
        expectedChunkIds: ["wiki/auth#login"],
        requiredSubstrings: ["JWT"],
        scenario: "wiki",
      },
      appendedTo: "/tmp/w/tests/retrieval_eval/goldens/wiki.jsonl",
    });
    const thumbs = useFeedbackThumbs();
    const ok = await thumbs.promoteToGolden("fb-abc", "/tmp/w");
    expect(ok).toBe(true);
    expect(thumbs.lastPromotion.value?.appendedTo).toContain("wiki.jsonl");
    expect(thumbs.lastPromotion.value?.candidate.requiredSubstrings).toEqual(["JWT"]);
  });

  it("promoteToGolden returns false and stores error on failure", async () => {
    promoteMock.mockRejectedValue(new Error("404 not found"));
    const thumbs = useFeedbackThumbs();
    const ok = await thumbs.promoteToGolden("fb-missing", "/tmp/w");
    expect(ok).toBe(false);
    expect(thumbs.lastError.value).toBe("404 not found");
  });
});
