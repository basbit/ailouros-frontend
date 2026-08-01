import { describe, it, expect } from "vitest";
import { computed, ref } from "vue";

import {
  useRunLiveSteps,
  SYSTEM_LOG_GROUP_ID,
  type EventRow,
  type HistorySource,
  type LogFilter,
} from "./useRunLiveSteps";

type UiStub = Parameters<typeof useRunLiveSteps>[0]["ui"];
type ControllerStub = Parameters<typeof useRunLiveSteps>[0]["controller"];

function setup(history: HistorySource) {
  const ui = {
    taskHistory: [],
    taskId: null,
    taskPipelinePlan: null,
    historyList: [],
    orchestratorCompletedSteps: new Set<string>(),
    activeStep: null,
  } as unknown as UiStub;
  const controller = {
    currentPipelineSteps: computed<string[]>(() => []),
  } as unknown as ControllerStub;
  return useRunLiveSteps({
    ui,
    controller,
    isRunning: computed(() => false),
    logFilter: ref<LogFilter>("all"),
    history: computed(() => history),
  });
}

describe("useRunLiveSteps — stepGroups", () => {
  const events: EventRow[] = [
    {
      agent: "pm",
      message: "framed",
      status: "completed",
      timestamp: "2026-07-23T10:00:00Z",
    },
    {
      agent: "pm",
      message: "handoff",
      status: "completed",
      timestamp: "2026-07-23T10:00:30Z",
    },
    {
      agent: "dev",
      message: "wrote code",
      status: "completed",
      timestamp: "2026-07-23T10:02:00Z",
    },
    {
      agent: "orchestrator",
      message: "pipeline done",
      status: "completed",
      timestamp: "2026-07-23T10:05:00Z",
    },
  ];
  const history: HistorySource = { pipelineSteps: ["pm", "ba", "dev"], events };

  it("groups events under their step by agent", () => {
    const { stepGroups } = setup(history);
    const byId = Object.fromEntries(stepGroups.value.map((g) => [g.id, g]));
    expect(byId.pm.events.map((e) => e.message)).toEqual(["framed", "handoff"]);
    expect(byId.dev.events.map((e) => e.message)).toEqual(["wrote code"]);
    expect(byId.ba.events).toEqual([]); // step with no output still present
  });

  it("computes per-step duration from first→last event", () => {
    const { stepGroups } = setup(history);
    const pm = stepGroups.value.find((g) => g.id === "pm");
    expect(pm?.durationMs).toBe(30_000); // 10:00:00 → 10:00:30
    const dev = stepGroups.value.find((g) => g.id === "dev");
    expect(dev?.durationMs).toBeNull(); // single event → no span
  });

  it("buckets orchestrator/system events into a system group", () => {
    const { stepGroups } = setup(history);
    const system = stepGroups.value.find((g) => g.id === SYSTEM_LOG_GROUP_ID);
    expect(system).toBeTruthy();
    expect(system?.events.map((e) => e.message)).toEqual(["pipeline done"]);
    expect(system?.state).toBe("system");
  });

  it("carries the step state onto its group", () => {
    const { stepGroups } = setup(history);
    const pm = stepGroups.value.find((g) => g.id === "pm");
    expect(pm?.state).toBe("completed");
  });
});
