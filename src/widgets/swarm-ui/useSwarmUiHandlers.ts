/**
 * useSwarmUiHandlers — page-level glue handlers extracted from `SwarmUiPage`.
 * History, prompt mutation, profile update propagation, events view mode and
 * "close loaded task" all live here so the page becomes a thin orchestrator.
 */

import { useProjectsStore } from "@/shared/store/projects";
import type { RemoteProfileRow } from "@/shared/store/projects";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { recommendedStepsForTopology } from "@/shared/lib/pipeline-topology";
import type { useSettings } from "@/widgets/settings/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

export interface SwarmUiHandlers {
  onResetRecommendedSteps: () => void;
  onProfileUpdate: (idx: number, field: keyof RemoteProfileRow, val: string) => void;
  onPromptUpdate: (val: string) => void;
  onAppendToPrompt: (text: string) => void;
  onHumanManualReviewUpdate: (val: boolean) => void;
  onEventsViewMode: (mode: "preview" | "raw") => void;
  onClearHistory: () => Promise<void>;
  onUseHistoryAsContext: (id: string) => void;
  onCloseLoadedTask: () => void;
  onViewHistoryRun: (id: string) => Promise<void>;
}

export function useSwarmUiHandlers(
  settings: SettingsApi,
  options: {
    syncTaskFromServer: (taskId: string) => Promise<unknown>;
    sendWsSubscribe: () => void;
  },
): SwarmUiHandlers {
  const projectsStore = useProjectsStore();
  const ui = useUiStore();
  const taskStore = useTaskStore();
  const ux = useUxStore();
  const { t } = useI18n();

  function onResetRecommendedSteps(): void {
    const ids = recommendedStepsForTopology(settings.form.swarm_topology);
    settings.pipelineState.applyStepIds(ids);
  }

  function onProfileUpdate(
    idx: number,
    field: keyof RemoteProfileRow,
    val: string,
  ): void {
    settings.profilesState.updateProfile(idx, field, val);
    settings.rolesState.refreshAllProfileSelects();
  }

  function onPromptUpdate(val: string): void {
    settings.form.prompt = val;
    settings.saveSettingsSoon();
  }

  function onAppendToPrompt(text: string): void {
    settings.form.prompt = settings.form.prompt
      ? settings.form.prompt + "\n" + text
      : text;
    settings.saveSettingsSoon();
  }

  function onHumanManualReviewUpdate(val: boolean): void {
    settings.form.human_manual_review = val;
    settings.saveSettingsSoon();
  }

  function onEventsViewMode(mode: "preview" | "raw"): void {
    ui.eventsViewMode = mode;
    ui.saveEventsView(projectsStore.currentId);
  }

  async function onClearHistory(): Promise<void> {
    const confirmed = await ux.confirmDialog({
      title: t("dialogs.history.clear.title"),
      message: t("dialogs.history.clear.message"),
    });
    if (!confirmed) return;
    ui.clearHistory(projectsStore.currentId);
  }

  function onUseHistoryAsContext(id: string): void {
    const h = ui.historyList.find((x) => x.id === id);
    if (!h) return;
    const block = (h.prompt ?? "").trim();
    if (!block) return;
    const cur = settings.form.prompt.trim();
    settings.form.prompt = cur ? block + "\n\n---\n\n" + cur : block;
    if (h.workspace_root !== undefined)
      settings.form.workspace_root = h.workspace_root ?? "";
    if (h.project_context_file !== undefined)
      settings.form.project_context_file = h.project_context_file ?? "";
    if (h.workspace_write !== undefined)
      settings.form.workspace_write = h.workspace_write ?? false;
    settings.saveSettingsSoon();
  }

  function onCloseLoadedTask(): void {
    // "Close" the currently loaded run: clear the events/status/artifact view,
    // drop the active task id from local persistence, and reset the task store.
    // This is a UI-side clear — it does not cancel a running task on the
    // server (the stop button handles that, and the X is only shown when
    // !isRunning).
    ui.resetTaskView();
    ui.persistActiveTask(null, projectsStore.currentId);
    taskStore.resetTask();
    options.sendWsSubscribe();
  }

  async function onViewHistoryRun(id: string): Promise<void> {
    const entry = ui.historyList.find((x) => x.id === id);
    const tid = entry?.taskId?.trim();
    if (!tid) {
      await ux.alertDialog({
        title: t("dialogs.history.noTask.title"),
        message: t("dialogs.history.noTask.message"),
      });
      return;
    }
    ui.taskId = tid;
    ui.persistActiveTask(tid, projectsStore.currentId);
    taskStore.setTaskId(tid);
    await options.syncTaskFromServer(tid);
    options.sendWsSubscribe();
  }

  return {
    onResetRecommendedSteps,
    onProfileUpdate,
    onPromptUpdate,
    onAppendToPrompt,
    onHumanManualReviewUpdate,
    onEventsViewMode,
    onClearHistory,
    onUseHistoryAsContext,
    onCloseLoadedTask,
    onViewHistoryRun,
  };
}
