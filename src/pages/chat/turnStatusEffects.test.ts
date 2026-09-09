import { describe, expect, it } from "vitest";
import { findActiveTurn, resolveTurnStatusUpdate } from "./turnStatusEffects";
import type { ConversationTurnDto } from "@/shared/api/endpoints/conversation";

const COPY = {
  doneWithFailures: "Finished with failures.",
  blockedBubble: (reason: string) => `Pipeline blocked: ${reason}`,
  blockedTitle: "Pipeline blocked",
};

function resolve(
  taskStatus: string | null,
  turnStatus: string | null,
  extra: Partial<{
    blockedReason: string | null;
    taskError: unknown;
  }> = {},
) {
  return resolveTurnStatusUpdate({
    taskStatus,
    turnStatus,
    blockedReason: extra.blockedReason ?? null,
    taskError: extra.taskError ?? null,
    copy: COPY,
  });
}

describe("resolveTurnStatusUpdate", () => {
  it("marks the turn completed for every terminal success status", () => {
    for (const status of [
      "completed",
      "completed_no_writes",
      "completed_with_failures",
    ]) {
      expect(resolve(status, "running")).toMatchObject({
        status: "completed",
        scroll: true,
      });
    }
  });

  it("uses the honest message for completed_with_failures", () => {
    expect(resolve("completed_with_failures", "running")?.assistantMessage).toBe(
      "Finished with failures.",
    );
    expect(resolve("completed", "running")?.assistantMessage).toContain(
      "completed successfully",
    );
  });

  it("marks the turn awaiting_human only once", () => {
    const first = resolve("awaiting_human", "running");
    expect(first).toMatchObject({
      status: "awaiting_human",
      scroll: true,
    });
    expect(resolve("awaiting_human", "awaiting_human")).toBeNull();
  });

  it("marks the turn blocked with the blocked reason", () => {
    expect(
      resolve("blocked", "running", { blockedReason: "budget exhausted" }),
    ).toMatchObject({
      status: "blocked",
      assistantMessage: "Pipeline blocked: budget exhausted",
      scroll: true,
    });
    expect(resolve("blocked", "blocked")).toBeNull();
  });

  it("falls back to the generic blocked title without a reason", () => {
    expect(resolve("blocked", "running")?.assistantMessage).toBe("Pipeline blocked");
  });

  it("resumes a paused turn when the run flips back to running", () => {
    expect(resolve("running", "awaiting_human")).toMatchObject({
      status: "running",
      assistantMessage: "",
      scroll: false,
    });
    expect(resolve("in_progress", "blocked")).toMatchObject({
      status: "running",
      scroll: false,
    });
    expect(resolve("running", "completed")).toBeNull();
  });

  it("marks the turn failed with the task error", () => {
    expect(resolve("failed", "running", { taskError: "boom" })).toMatchObject({
      status: "failed",
      assistantMessage: "boom",
      scroll: true,
    });
    expect(resolve("cancelled", "running")?.assistantMessage).toBe(
      "Pipeline execution failed.",
    );
  });

  it("stays silent for unknown or empty statuses", () => {
    expect(resolve(null, "running")).toBeNull();
    expect(resolve("whatever", "running")).toBeNull();
  });
});

describe("findActiveTurn", () => {
  const turns = [
    { id: "turn-1", status: "running" },
    { id: "turn-2", status: "awaiting_human" },
  ] as ConversationTurnDto[];

  it("finds the active turn by id", () => {
    expect(findActiveTurn(turns, "turn-2")?.id).toBe("turn-2");
  });

  it("returns null for missing turn or empty list", () => {
    expect(findActiveTurn(turns, "nope")).toBeNull();
    expect(findActiveTurn(undefined, "turn-1")).toBeNull();
    expect(findActiveTurn(turns, null)).toBeNull();
  });
});
