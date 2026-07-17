import { describe, it, expect } from "vitest";
import { computed, ref } from "vue";

import { useRunLiveSteps, type LogFilter } from "./useRunLiveSteps";

type UiStub = Parameters<typeof useRunLiveSteps>[0]["ui"];
type ControllerStub = Parameters<typeof useRunLiveSteps>[0]["controller"];

const RUN_STEPS = ["clarify_input", "pm", "ba", "architect"];

function setup(ui: UiStub) {
  const controller = {
    currentPipelineSteps: computed<string[]>(() => []),
  } as unknown as ControllerStub;
  return useRunLiveSteps({
    ui,
    controller,
    isRunning: computed(() => true),
    logFilter: ref<LogFilter>("all"),
    history: computed(() => null),
  });
}

describe("useRunLiveSteps — run restored after a reload", () => {
  it("renders the steps recorded for the active run when no plan artifact exists yet", () => {
    const ui = {
      taskHistory: [],
      taskId: "task-1",
      taskPipelinePlan: null,
      historyList: [{ taskId: "task-1", pipeline_steps: RUN_STEPS }],
      orchestratorCompletedSteps: new Set<string>(),
      activeStep: "pm",
    } as unknown as UiStub;

    const { stepRows } = setup(ui);

    expect(stepRows.value.map((row) => row.id)).toEqual(RUN_STEPS);
  });

  it("prefers the server plan over the locally recorded steps", () => {
    const planSteps = ["clarify_input", "pm", "dev"];
    const ui = {
      taskHistory: [],
      taskId: "task-1",
      taskPipelinePlan: { pipeline_steps: planSteps },
      historyList: [{ taskId: "task-1", pipeline_steps: RUN_STEPS }],
      orchestratorCompletedSteps: new Set<string>(),
      activeStep: "pm",
    } as unknown as UiStub;

    const { stepRows } = setup(ui);

    expect(stepRows.value.map((row) => row.id)).toEqual(planSteps);
  });

  it("ignores steps recorded for a different run", () => {
    const ui = {
      taskHistory: [],
      taskId: "task-2",
      taskPipelinePlan: null,
      historyList: [{ taskId: "task-1", pipeline_steps: RUN_STEPS }],
      orchestratorCompletedSteps: new Set<string>(),
      activeStep: null,
    } as unknown as UiStub;

    const { stepRows } = setup(ui);

    expect(stepRows.value).toEqual([]);
  });
});
