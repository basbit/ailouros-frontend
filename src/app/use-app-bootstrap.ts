import { onMounted, onUnmounted, watch } from "vue";
import { useSettings } from "@/app/providers/useSettings";
import { APP_SETTINGS_KEY, type AppSettings } from "@/app/providers/settingsContext";
import { useSwarmRunController } from "@/features/swarm-run/useSwarmRunController";
import {
  SWARM_RUN_CONTROLLER_KEY,
  type SwarmRunController,
} from "@/features/swarm-run/swarmRunContext";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import {
  GLOBAL_SETTINGS_KEY,
  type GlobalSettingsApi,
} from "@/features/global-settings/globalSettingsContext";
import { useSettingsHotReload } from "@/shared/lib/use-settings-hot-reload";
import {
  useProjectFormActions,
  type ProjectFormActions,
  PROJECT_FORM_ACTIONS_KEY,
} from "@/entities/project-form";
import { useProjectsStore } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { getRolesCatalog } from "@/shared/api/endpoints/rolesCatalog";
import { useSwarmDefaults } from "@/shared/lib/use-swarm-defaults";
import { frontendLogger } from "@/shared/lib/frontend-logger";

export {
  APP_SETTINGS_KEY,
  SWARM_RUN_CONTROLLER_KEY,
  GLOBAL_SETTINGS_KEY,
  PROJECT_FORM_ACTIONS_KEY,
};

export interface AppBootstrap {
  settings: AppSettings;
  controller: SwarmRunController;
  globalSettings: GlobalSettingsApi;
  projectForm: ProjectFormActions;
}

export function useAppBootstrap(
  setWorkspaceRoot: (value: string) => void,
): AppBootstrap {
  const projects = useProjectsStore();
  const ui = useUiStore();
  const taskStore = useTaskStore();

  const settings = useSettings();
  const controller = useSwarmRunController(settings);
  const globalSettings = useGlobalSettings();
  const projectForm = useProjectFormActions(settings, {
    syncTaskFromServer: controller.syncTaskFromServer,
    sendWsSubscribe: controller.sendWsSubscribe,
  });

  useSettingsHotReload({
    intervalMs: 7000,
    enabled: () =>
      !settings.isBooting.value &&
      !controller.isRunning.value &&
      (typeof document === "undefined" || document.visibilityState === "visible"),
    fetcher: async () => {
      await settings.reloadProjectFile();
    },
  });

  watch(
    () => settings.form.workspace_root,
    (workspaceRoot) => {
      setWorkspaceRoot(workspaceRoot);
    },
    { immediate: true },
  );

  useSwarmDefaults();

  onMounted(async () => {
    try {
      await getRolesCatalog();
    } catch (err) {
      frontendLogger.error("getRolesCatalog: bootstrap fetch failed", err);
    }
    void globalSettings.loadFromBackend();
    await settings.init();
    ui.loadEventsView(projects.currentId);
    ui.loadHistory(projects.currentId);
    const taskId = ui.restoreActiveTask(projects.currentId);
    ui.taskId = taskId;
    if (taskId) {
      taskStore.setTaskId(taskId);
      void controller.syncTaskFromServer(taskId);
    }
    window.addEventListener("beforeunload", settings.flushSave);
  });

  onUnmounted(() => {
    window.removeEventListener("beforeunload", settings.flushSave);
  });

  return { settings, controller, globalSettings, projectForm };
}
