import type { useUiStore } from "./ui";
import type { useTaskStore } from "./task";

/**
 * Forget the active task everywhere it is remembered: the persisted pointer
 * (which bootstrap re-hydrates after a reload) and the task store. Stopping a
 * run and resetting an unavailable one both need exactly this; a stop that
 * skipped it left a dead task "active" until the next restart.
 */
export function clearActiveTask(deps: {
  ui: ReturnType<typeof useUiStore>;
  taskStore: ReturnType<typeof useTaskStore>;
  projectId: string;
}): void {
  deps.ui.persistActiveTask(null, deps.projectId);
  deps.taskStore.resetTask();
}
