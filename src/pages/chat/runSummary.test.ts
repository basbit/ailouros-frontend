import { describe, expect, it } from "vitest";

import { parseChatStreamSiblingExtra } from "@/shared/lib/chat-stream-events";
import { resolveTurnStatusUpdate } from "./turnStatusEffects";

const COPY = {
  doneOk: "Done",
  doneWithFailures: "Done with failures",
  awaitingHuman: "Waiting",
  failed: "Failed",
  blockedBubble: (reason: string) => `Blocked: ${reason}`,
  blockedTitle: "Blocked",
};

describe("run summary", () => {
  it("is parsed off the stream", () => {
    const event = parseChatStreamSiblingExtra({
      run_summary: { text: "Files changed: 0." },
    });

    expect(event).toEqual({ kind: "run_summary", text: "Files changed: 0." });
  });

  it("is what the chat bubble says when the run ends", () => {
    const update = resolveTurnStatusUpdate({
      taskStatus: "completed",
      turnStatus: "running",
      blockedReason: null,
      taskError: null,
      runSummary: "No files were changed. Files changed: 0.",
      copy: COPY,
    });

    expect(update?.assistantMessage).toBe("No files were changed. Files changed: 0.");
  });

  it("falls back to the status string when the run produced no summary", () => {
    const update = resolveTurnStatusUpdate({
      taskStatus: "completed",
      turnStatus: "running",
      blockedReason: null,
      taskError: null,
      runSummary: "",
      copy: COPY,
    });

    expect(update?.assistantMessage).toBe("Done");
  });

  it("does not replace a failure message with the summary", () => {
    const update = resolveTurnStatusUpdate({
      taskStatus: "failed",
      turnStatus: "running",
      blockedReason: null,
      taskError: null,
      runSummary: "Files changed: 0.",
      copy: COPY,
    });

    expect(update?.assistantMessage).toContain("Failed");
  });
});
