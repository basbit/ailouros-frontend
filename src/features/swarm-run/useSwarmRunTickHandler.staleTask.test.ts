import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/entities/project";
import { LS_ACTIVE_TASK } from "@/shared/lib/swarm-ui-constants";
import * as hydrateModule from "@/shared/lib/hydrate-task";
import { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";
import { useSwarmRunState } from "./useSwarmRunState";

vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: vi.fn().mockResolvedValue({ steps: [] }),
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const TASK_ID = "00000000-dead-0000-0000-000000000000";

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

describe("run availability for a task the server does not know", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("resolves a pointer to an unknown task as unavailable instead of running", async () => {
    vi.spyOn(hydrateModule, "resolveTaskFromServer").mockResolvedValue({
      outcome: "unknown",
    });

    const ui = useUiStore();
    ui.taskId = TASK_ID;
    ui.taskStatus = "running";
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.syncTaskFromServer(TASK_ID);

    expect(ui.runAvailability).toBe("unavailable");
    expect(ui.taskStatus).toBeNull();
  });

  it("never reports an unavailable run as running", async () => {
    vi.spyOn(hydrateModule, "resolveTaskFromServer").mockResolvedValue({
      outcome: "unknown",
    });

    const state = useSwarmRunState();
    state.ui.taskId = TASK_ID;
    state.ui.taskStatus = "running";
    state.ui.runAvailability = "unavailable";

    expect(state.isRunning.value).toBe(false);
  });

  it("surfaces the lookup error instead of guessing a status", async () => {
    vi.spyOn(hydrateModule, "resolveTaskFromServer").mockResolvedValue({
      outcome: "error",
      message: "HTTP 503",
    });

    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.syncTaskFromServer(TASK_ID);

    expect(ui.runAvailability).toBe("lookup_failed");
    expect(ui.runAvailabilityError).toBe("HTTP 503");
    expect(ui.taskStatus).toBeNull();
  });

  it("flags a live tick for a forgotten task as unavailable", () => {
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    ui.taskStatus = "running";
    const handler = useSwarmRunTickHandler(buildState(ui));

    handler.applyTick({ type: "tick", task: { error: "not_found", task_id: TASK_ID } });

    expect(ui.runAvailability).toBe("unavailable");
    expect(ui.taskStatus).toBeNull();
  });

  it("clears the stale pointer when the run is reset", () => {
    const ui = useUiStore();
    const projects = useProjectsStore();
    const storageKey = `${LS_ACTIVE_TASK}_${projects.currentId}`;
    window.localStorage.setItem(storageKey, JSON.stringify({ taskId: TASK_ID }));
    ui.taskId = TASK_ID;
    ui.runAvailability = "unavailable";

    ui.persistActiveTask(null, projects.currentId);
    ui.resetTaskView();

    expect(window.localStorage.getItem(storageKey)).toBeNull();
    expect(ui.runAvailability).toBe("unresolved");
    expect(ui.taskId).toBeNull();
  });
});
