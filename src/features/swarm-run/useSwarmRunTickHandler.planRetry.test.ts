import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/shared/store/projects";
import { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

const planMock = vi.fn();

vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: (taskId: string) => planMock(taskId),
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const TASK_ID = "11111111-2222-3333-4444-555555555555";
const PLAN = { pipeline_steps: ["clarify_input", "pm"] };

function buildState(ui: ReturnType<typeof useUiStore>) {
  return {
    ui,
    taskStore: { setTask: vi.fn(), setTaskId: vi.fn(), resetTask: vi.fn() },
    projectsStore: useProjectsStore(),
    currentPipelineSteps: ref<string[]>([]),
    lastNotifiedError: ref<string | null>(null),
    runBootstrapPending: ref(false),
    lastPipelinePlanLoadKey: ref(""),
    applyHydratedTask: vi.fn(),
    updateRunHistory: vi.fn(),
  } as never;
}

describe("pipeline plan loading", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    planMock.mockReset();
    vi.useRealTimers();
  });

  it("retries after a miss, because the plan artifact appears only later in the run", async () => {
    planMock.mockRejectedValueOnce(new Error("404 not found"));
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.loadPipelinePlan(TASK_ID, "running");
    expect(ui.taskPipelinePlan).toBeNull();

    planMock.mockResolvedValueOnce(PLAN);
    vi.setSystemTime(Date.now() + 60_000);
    await handler.loadPipelinePlan(TASK_ID, "running");

    expect(planMock).toHaveBeenCalledTimes(2);
    expect(ui.taskPipelinePlan).toEqual(PLAN);
  });

  it("does not refetch on every tick while the plan is still missing", async () => {
    planMock.mockRejectedValue(new Error("404 not found"));
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.loadPipelinePlan(TASK_ID, "running");
    await handler.loadPipelinePlan(TASK_ID, "running");
    await handler.loadPipelinePlan(TASK_ID, "running");

    expect(planMock).toHaveBeenCalledTimes(1);
  });

  it("never refetches once the plan was loaded", async () => {
    planMock.mockResolvedValue(PLAN);
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.loadPipelinePlan(TASK_ID, "completed");
    vi.setSystemTime(Date.now() + 60_000);
    await handler.loadPipelinePlan(TASK_ID, "completed");

    expect(planMock).toHaveBeenCalledTimes(1);
    expect(ui.taskPipelinePlan).toEqual(PLAN);
  });

  it("keeps an already loaded plan when a later refresh misses", async () => {
    planMock.mockResolvedValueOnce(PLAN);
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));
    await handler.loadPipelinePlan(TASK_ID, "running");

    planMock.mockRejectedValueOnce(new Error("transient 500"));
    vi.setSystemTime(Date.now() + 60_000);
    await handler.loadPipelinePlan(TASK_ID, "failed");

    expect(ui.taskPipelinePlan).toEqual(PLAN);
  });
});
