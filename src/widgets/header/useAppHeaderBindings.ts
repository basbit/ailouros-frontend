import { computed, inject } from "vue";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run/swarmRunContext";
import { useInjectedProjectFormActions } from "@/entities/project-form";

export function useAppHeaderBindings() {
  const injectedSettings = inject(APP_SETTINGS_KEY);
  const injectedController = inject(SWARM_RUN_CONTROLLER_KEY);
  if (!injectedSettings || !injectedController) {
    throw new Error(
      "useAppHeaderBindings requires APP_SETTINGS_KEY and SWARM_RUN_CONTROLLER_KEY",
    );
  }
  void injectedSettings;
  const controller = injectedController;
  const projectForm = useInjectedProjectFormActions();

  const projects = useProjectsStore();
  const ui = useUiStore();
  const taskStore = useTaskStore();

  const taskId = computed(() => ui.taskId);
  const isRunning = computed(() => controller.isRunning.value);
  const currentProjectId = computed(() => projects.currentId);
  const projectList = computed(() => projects.projectList);
  const projectName = computed(() => {
    const data = projects.data;
    if (!data) return "";
    return data.projects[data.current]?.name ?? data.current;
  });

  function closeLoadedTask(): void {
    ui.resetTaskView();
    ui.persistActiveTask(null, projects.currentId);
    taskStore.resetTask();
    controller.sendWsSubscribe();
  }

  return {
    taskId,
    isRunning,
    currentProjectId,
    projectList,
    projectName,
    projectForm,
    closeLoadedTask,
  };
}
