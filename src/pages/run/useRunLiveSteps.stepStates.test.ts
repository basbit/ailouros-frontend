import { describe, it, expect } from "vitest";
import { computed, ref } from "vue";

import { useRunLiveSteps, type EventRow, type LogFilter } from "./useRunLiveSteps";

type UiStub = Parameters<typeof useRunLiveSteps>[0]["ui"];
type ControllerStub = Parameters<typeof useRunLiveSteps>[0]["controller"];

const STEPS = ["clarify_input", "pm", "ba", "dev", "qa"];

function setup(options: {
  events: EventRow[];
  activeStep?: string | null;
  completed?: string[];
  isRunning?: boolean;
}) {
  const ui = {
    taskHistory: options.events,
    taskId: "task-1",
    taskPipelinePlan: { pipeline_steps: STEPS },
    historyList: [],
    orchestratorCompletedSteps: new Set<string>(options.completed ?? []),
    activeStep: options.activeStep ?? null,
  } as unknown as UiStub;
  const controller = {
    currentPipelineSteps: computed<string[]>(() => []),
  } as unknown as ControllerStub;
  return useRunLiveSteps({
    ui,
    controller,
    isRunning: computed(() => options.isRunning ?? true),
    logFilter: ref<LogFilter>("all"),
    history: computed(() => null),
  });
}

function statesOf(rows: { id: string; state: string }[]): Record<string, string> {
  return Object.fromEntries(rows.map((row) => [row.id, row.state]));
}

describe("useRunLiveSteps — step states without live orchestrator events", () => {
  const reloadedMidRun: EventRow[] = [
    { agent: "clarify_input", message: "asking", status: "in_progress" },
    { agent: "pm", message: "planning", status: "completed" },
    { agent: "ba", message: "analysing", status: "in_progress" },
  ];

  it("marks exactly one step active", () => {
    const { stepRows } = setup({ events: reloadedMidRun, activeStep: "ba" });
    const active = stepRows.value.filter((row) => row.state === "active");
    expect(active.map((row) => row.id)).toEqual(["ba"]);
  });

  it("treats a started step the run has moved past as done", () => {
    const { stepRows } = setup({ events: reloadedMidRun, activeStep: "ba" });
    expect(statesOf(stepRows.value).clarify_input).toBe("completed");
  });

  it("reports the active step's real position", () => {
    const { currentStepIndex, totalSteps } = setup({
      events: reloadedMidRun,
      activeStep: "ba",
    });
    expect(currentStepIndex.value).toBe(3);
    expect(totalSteps.value).toBe(5);
  });

  it("leaves steps that never ran pending rather than inventing completion", () => {
    const { stepRows } = setup({ events: reloadedMidRun, activeStep: "ba" });
    const byId = statesOf(stepRows.value);
    expect(byId.dev).toBe("pending");
    expect(byId.qa).toBe("pending");
  });

  it("keeps a failed step failed even when the run moved on", () => {
    const { stepRows } = setup({
      events: [
        { agent: "clarify_input", message: "ok", status: "completed" },
        { agent: "pm", message: "boom", status: "failed" },
        { agent: "ba", message: "analysing", status: "in_progress" },
      ],
      activeStep: "ba",
    });
    expect(statesOf(stepRows.value).pm).toBe("failed");
  });

  it("does not infer completion from a step that only started after the active one", () => {
    const { stepRows } = setup({
      events: [
        { agent: "ba", message: "analysing", status: "in_progress" },
        { agent: "qa", message: "late straggler", status: "in_progress" },
      ],
      activeStep: "ba",
    });
    expect(statesOf(stepRows.value).qa).toBe("pending");
  });

  it("falls back to the last started step when no active step is known", () => {
    const { stepRows } = setup({ events: reloadedMidRun, activeStep: null });
    const active = stepRows.value.filter((row) => row.state === "active");
    expect(active.map((row) => row.id)).toEqual(["ba"]);
  });

  it("never marks a step active once the run stopped running", () => {
    const { stepRows } = setup({
      events: reloadedMidRun,
      activeStep: "ba",
      isRunning: false,
    });
    expect(stepRows.value.some((row) => row.state === "active")).toBe(false);
  });
});
