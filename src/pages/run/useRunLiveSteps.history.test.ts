import { describe, it, expect } from "vitest";
import { computed, ref } from "vue";

import {
  useRunLiveSteps,
  type EventRow,
  type HistorySource,
  type LogFilter,
} from "./useRunLiveSteps";

type UiStub = Parameters<typeof useRunLiveSteps>[0]["ui"];
type ControllerStub = Parameters<typeof useRunLiveSteps>[0]["controller"];

/**
 * Minimal live-store stub. For the history path these are all empty: the bug is
 * exactly that the historical run was sourced from this (empty) live store, so
 * leaving them empty proves the data comes from the history source instead.
 */
function makeEmptyUiStub(): UiStub {
  return {
    taskHistory: [],
    taskId: null,
    taskPipelinePlan: null,
    historyList: [],
    orchestratorCompletedSteps: new Set<string>(),
    activeStep: null,
  } as unknown as UiStub;
}

function makeControllerStub(): ControllerStub {
  return {
    currentPipelineSteps: computed<string[]>(() => []),
  } as unknown as ControllerStub;
}

function setup(history: HistorySource | null) {
  const ui = makeEmptyUiStub();
  const controller = makeControllerStub();
  const isRunning = computed(() => false);
  const logFilter = ref<LogFilter>("all");
  return useRunLiveSteps({
    ui,
    controller,
    isRunning,
    logFilter,
    history: computed(() => history),
  });
}

describe("useRunLiveSteps — history source", () => {
  const events: EventRow[] = [
    { agent: "analyst", message: "did analysis", status: "completed", timestamp: "t1" },
    { agent: "coder", message: "wrote code", status: "completed", timestamp: "t2" },
    { agent: "tester", message: "tests failed", status: "failed", timestamp: "t3" },
  ];

  const history: HistorySource = {
    pipelineSteps: ["analyst", "coder", "tester", "reviewer"],
    events,
  };

  it("renders steps from the historical entry, not the (empty) live store", () => {
    const { stepRows } = setup(history);
    expect(stepRows.value.map((row) => row.id)).toEqual([
      "analyst",
      "coder",
      "tester",
      "reviewer",
    ]);
  });

  it("derives per-step completed/failed/pending status from snapshot events", () => {
    const { stepRows } = setup(history);
    const byId = Object.fromEntries(stepRows.value.map((r) => [r.id, r.state]));
    expect(byId.analyst).toBe("completed");
    expect(byId.coder).toBe("completed");
    expect(byId.tester).toBe("failed");
    // No event and not running -> pending (never "active" for a past run).
    expect(byId.reviewer).toBe("pending");
  });

  it("exposes the historical run log events (so the log is not empty/idle)", () => {
    const { events: liveEvents, filteredEvents } = setup(history);
    expect(liveEvents.value).toHaveLength(3);
    expect(filteredEvents.value.map((e) => e.message)).toEqual([
      "did analysis",
      "wrote code",
      "tests failed",
    ]);
  });

  it("filters the historical log to errors only", () => {
    const ui = makeEmptyUiStub();
    const controller = makeControllerStub();
    const logFilter = ref<LogFilter>("errors");
    const { filteredEvents } = useRunLiveSteps({
      ui,
      controller,
      isRunning: computed(() => false),
      logFilter,
      history: computed(() => history),
    });
    expect(filteredEvents.value.map((e) => e.agent)).toEqual(["tester"]);
  });

  it("falls back to the live store when no history source is provided", () => {
    const { stepRows, events: liveEvents } = setup(null);
    expect(stepRows.value).toEqual([]);
    expect(liveEvents.value).toEqual([]);
  });

  it("marks the snapshot failed_step as failed when its own events never said so", () => {
    // The pipeline's final error event is attributed to the orchestrator, so
    // a step that died mid-flight only has in_progress events. The snapshot's
    // failed_step is the source of truth for where the run stopped.
    const { stepRows } = setup({
      pipelineSteps: ["pm", "dev", "qa"],
      events: [
        { agent: "pm", message: "ok", status: "completed", timestamp: "t1" },
        { agent: "dev", message: "working", status: "in_progress", timestamp: "t2" },
        { agent: "orchestrator", message: "boom", status: "failed", timestamp: "t3" },
      ],
      failedStep: "dev",
    });
    const byId = Object.fromEntries(stepRows.value.map((r) => [r.id, r.state]));
    expect(byId.pm).toBe("completed");
    expect(byId.dev).toBe("failed");
    expect(byId.qa).toBe("pending");
  });

  it("does not mark failed_step as failed when events say it completed", () => {
    const { stepRows } = setup({
      pipelineSteps: ["pm", "dev"],
      events: [{ agent: "dev", message: "ok", status: "completed", timestamp: "t1" }],
      failedStep: "dev",
    });
    const byId = Object.fromEntries(stepRows.value.map((r) => [r.id, r.state]));
    expect(byId.dev).toBe("completed");
  });
});
