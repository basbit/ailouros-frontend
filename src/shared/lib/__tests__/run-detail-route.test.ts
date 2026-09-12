import { describe, expect, it } from "vitest";
import { runDetailRoute } from "../run-detail-route";

const HISTORY = [
  { id: "history-entry-1", taskId: "task-abc" },
  { id: "history-entry-2", taskId: "task-def" },
] as never[];

describe("runDetailRoute", () => {
  it("prefers the history entry id when the run is listed", () => {
    expect(runDetailRoute(HISTORY, "task-def")).toBe("/history/history-entry-2");
  });

  it("accepts the history entry id itself", () => {
    expect(runDetailRoute(HISTORY, "history-entry-1")).toBe("/history/history-entry-1");
  });

  it("falls back to the task id for a run not yet in history", () => {
    // The screenshots showed the header pill's task id differing from the
    // history route id, so this fallback is the common case for a live run.
    expect(runDetailRoute(HISTORY, "task-brand-new")).toBe("/history/task-brand-new");
  });

  it("tolerates surrounding whitespace on the task id", () => {
    expect(runDetailRoute(HISTORY, "  task-abc  ")).toBe("/history/history-entry-1");
  });

  it("encodes ids that are not URL-safe", () => {
    expect(runDetailRoute([], "task/with space")).toBe("/history/task%2Fwith%20space");
  });
});
