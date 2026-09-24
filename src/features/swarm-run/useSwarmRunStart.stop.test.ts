/**
 * Stop must forget the task: the persisted active-task pointer and the task
 * store used to keep a cancelled run "active" across reloads. A task the
 * server no longer has is re-read from the server, not marked cancelled.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const cancelTaskMock = vi.fn();
vi.mock("@/shared/api/endpoints/tasks-runtime", () => ({
  cancelTask: (taskId: string) => cancelTaskMock(taskId),
}));
vi.mock("@/features/swarm-run/run-swarm-chat", () => ({ runSwarmChat: vi.fn() }));
vi.mock("@/shared/lib/streaming-rag-events", () => ({
  recordRetrievalDone: vi.fn(),
  resetRetrievalEvents: vi.fn(),
}));
vi.mock("./useSwarmRunStreamHandler", () => ({
  createSwarmStreamEventHandler: () => vi.fn(),
}));

import { ApiError } from "@/shared/api/http";
import { useSwarmRunStart } from "./useSwarmRunStart";
import type { SwarmRunState } from "./useSwarmRunState";

function makeStart() {
  const ui = {
    taskId: "task-1" as string | null,
    taskStatus: "awaiting_human" as string | null,
    pendingApprovals: 1,
    humanGateVisible: true,
    shellGateVisible: false,
    manualShellGateVisible: false,
    retryGateVisible: false,
    persistActiveTask: vi.fn(),
    resetTaskView: vi.fn(),
  };
  const taskStore = { resetTask: vi.fn(), setTaskId: vi.fn() };
  const updateRunHistory = vi.fn();
  const syncTaskFromServer = vi.fn().mockResolvedValue(undefined);
  const notify = vi.fn();
  const start = useSwarmRunStart({
    state: {
      ui,
      taskStore,
      projectsStore: { currentId: "proj-1" },
      currentPipelineSteps: ref([]),
      lastNotifiedError: ref(null),
      runBootstrapPending: ref(false),
      lastPipelinePlanLoadKey: ref(""),
      waitForUiPaint: vi.fn(),
      updateRunHistory,
    } as unknown as SwarmRunState,
    tickHandler: { applyOrchestratorEvent: vi.fn(), syncTaskFromServer } as never,
    sendWsSubscribe: vi.fn(),
    settings: { form: { prompt: "" } } as never,
    ux: { notify } as never,
    t: ((key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key) as never,
    preflight: { resolveScenario: vi.fn(), surfacePreflightFailure: vi.fn() } as never,
  });
  return { start, ui, taskStore, updateRunHistory, syncTaskFromServer, notify };
}

describe("useSwarmRunStart.onStopRun", () => {
  beforeEach(() => {
    cancelTaskMock.mockReset();
  });

  it("marks the run cancelled, closes its gates and forgets it as the active task", async () => {
    cancelTaskMock.mockResolvedValue({ task_id: "task-1", status: "cancelled", was_active: true });
    const { start, ui, taskStore, updateRunHistory } = makeStart();

    expect(await start.onStopRun()).toBe(true);

    expect(ui.taskStatus).toBe("cancelled");
    expect(ui.humanGateVisible).toBe(false);
    expect(ui.pendingApprovals).toBe(0);
    expect(ui.persistActiveTask).toHaveBeenCalledWith(null, "proj-1");
    expect(taskStore.resetTask).toHaveBeenCalledTimes(1);
    expect(updateRunHistory).toHaveBeenCalledWith("cancelled", null);
  });

  it("re-reads a task the server did not have running instead of calling it cancelled", async () => {
    cancelTaskMock.mockResolvedValue({ task_id: "task-1", status: "completed", was_active: false });
    const { start, ui, taskStore, syncTaskFromServer } = makeStart();

    await start.onStopRun();

    expect(syncTaskFromServer).toHaveBeenCalledWith("task-1");
    expect(ui.taskStatus).not.toBe("cancelled");
    expect(ui.persistActiveTask).toHaveBeenCalledWith(null, "proj-1");
    expect(taskStore.resetTask).toHaveBeenCalledTimes(1);
  });

  it("treats a 404 as an unknown task: re-sync and forget, no cancelled status", async () => {
    cancelTaskMock.mockRejectedValue(new ApiError("not found", 404, ""));
    const { start, ui, syncTaskFromServer } = makeStart();

    await start.onStopRun();

    expect(syncTaskFromServer).toHaveBeenCalledWith("task-1");
    expect(ui.taskStatus).toBe("awaiting_human");
    expect(ui.persistActiveTask).toHaveBeenCalledWith(null, "proj-1");
  });

  it("keeps the run on a network failure and says so", async () => {
    cancelTaskMock.mockRejectedValue(new Error("Failed to fetch"));
    const { start, ui, taskStore, notify } = makeStart();

    expect(await start.onStopRun()).toBe(false);

    expect(ui.taskStatus).toBe("awaiting_human");
    expect(ui.persistActiveTask).not.toHaveBeenCalled();
    expect(taskStore.resetTask).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      'toast.cancelFailed:{"error":"Failed to fetch"}',
      "error",
      expect.any(Number),
    );
  });
});
