import { computed } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/entities/project";
import { useTaskStore } from "@/shared/store/task";
import { clearActiveTask } from "@/shared/store/clear-active-task";

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
    clearActiveTask({ ui, taskStore, projectId: projects.currentId });
    ui.resetTaskView();
    sendWsSubscribe();
  }

  return { ui, isRunUnavailable, resetUnavailableRun };
}
