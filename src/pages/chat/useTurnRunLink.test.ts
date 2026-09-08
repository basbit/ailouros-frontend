import { describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
import { useTurnRunLink } from "./useTurnRunLink";

function setup(initialTaskId: string | null = null) {
  const taskId = ref<string | null>(initialTaskId);
  const activeTurnId = ref<string | null>(null);
  const linked = new Map<string, string>();
  const patchTurn = vi.fn((turnId: string, updates: { task_id: string }) => {
    linked.set(turnId, updates.task_id);
  });
  const scope = effectScope();
  scope.run(() => {
    useTurnRunLink({
      taskId: () => taskId.value,
      activeTurnId,
      linkedTaskId: (turnId) => linked.get(turnId) ?? null,
      patchTurn,
    });
  });
  return { taskId, activeTurnId, patchTurn, scope };
}

describe("useTurnRunLink", () => {
  it("links the turn as soon as the run reports a task id, before it finishes", async () => {
    const { taskId, activeTurnId, patchTurn } = setup();
    activeTurnId.value = "turn-1";
    await nextTick();
    expect(patchTurn).not.toHaveBeenCalled();

    taskId.value = "task-42";
    await nextTick();

    expect(patchTurn).toHaveBeenCalledWith("turn-1", {
      task_id: "task-42",
      status: "running",
    });
  });

  it("links a turn that was already active when the task id existed", async () => {
    const { activeTurnId, patchTurn } = setup("task-7");
    activeTurnId.value = "turn-1";
    await nextTick();

    expect(patchTurn).toHaveBeenCalledWith("turn-1", {
      task_id: "task-7",
      status: "running",
    });
  });

  it("does not re-patch a turn that already carries the task id", async () => {
    const { taskId, activeTurnId, patchTurn } = setup();
    activeTurnId.value = "turn-1";
    taskId.value = "task-42";
    await nextTick();
    expect(patchTurn).toHaveBeenCalledTimes(1);

    taskId.value = "task-42";
    await nextTick();

    expect(patchTurn).toHaveBeenCalledTimes(1);
  });

  it("ignores an empty task id and an inactive turn", async () => {
    const { taskId, activeTurnId, patchTurn } = setup();
    taskId.value = "task-42";
    await nextTick();
    expect(patchTurn).not.toHaveBeenCalled();

    activeTurnId.value = "turn-1";
    taskId.value = null;
    await nextTick();
    expect(patchTurn).not.toHaveBeenCalled();
  });
});
