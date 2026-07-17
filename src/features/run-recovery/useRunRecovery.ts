import { computed } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/shared/store/projects";
import { useTaskStore } from "@/shared/store/task";

interface RunRecoveryDeps {
  sendWsSubscribe: () => void;
}

export function useRunRecovery({ sendWsSubscribe }: RunRecoveryDeps) {
  const ui = useUiStore();
  const projects = useProjectsStore();
  const taskStore = useTaskStore();

  const isRunUnavailable = computed(
    () =>
      !!ui.taskId &&
      (ui.runAvailability === "unavailable" || ui.runAvailability === "lookup_failed"),
  );

  function resetUnavailableRun(): void {
    ui.persistActiveTask(null, projects.currentId);
    ui.resetTaskView();
    taskStore.resetTask();
    sendWsSubscribe();
  }

  return { ui, isRunUnavailable, resetUnavailableRun };
}
