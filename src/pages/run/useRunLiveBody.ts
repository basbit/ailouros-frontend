import { computed, onMounted, ref } from "vue";
import {
  useRunLiveSteps,
  type EventRow,
  type HistorySource,
  type LogFilter,
  type StepState,
} from "./useRunLiveSteps";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useInjectedSwarmRunController } from "@/features/swarm-run";
import { useI18n } from "@/shared/lib/i18n";

export interface RunLiveBodyProps {
  hideHeader: boolean;
  historyEntry: HistoryEntry | null;
  historyEvents: EventRow[];
  historySteps: string[] | null;
  historyFailedStep: string | null;
}

export function useRunLiveBody(props: RunLiveBodyProps) {
  const ui = useUiStore();
  const controller = useInjectedSwarmRunController();
  const { t } = useI18n();

  const logFilter = ref<LogFilter>("all");

  const isHistoryView = computed(() => props.historyEntry !== null);

  // Gate visibility (awaiting_human etc.) is otherwise only recomputed at app
  // bootstrap or on a WS tick. Navigating to this page after a missed tick
  // (reconnect, hidden tab) left a paused run with no answer window — re-sync
  // from the server on every visit so the gate is re-surfaced.
  onMounted(() => {
    if (props.historyEntry !== null) return;
    if (!ui.taskId) return;
    void controller.syncTaskFromServer(ui.taskId);
  });

  const historySource = computed<HistorySource | null>(() => {
    const entry = props.historyEntry;
    if (!entry) return null;
    return {
      pipelineSteps: props.historySteps?.length
        ? props.historySteps
        : (entry.pipeline_steps ?? []),
      events: props.historyEvents,
      failedStep: props.historyFailedStep ?? null,
    };
  });

  const isRunning = computed(() =>
    isHistoryView.value ? false : controller.isRunning.value,
  );
  const hasActiveTask = computed(
    () => isHistoryView.value || !!ui.taskId || controller.isRunning.value,
  );

  const currentWorkspaceRoot = computed(() => {
    if (props.historyEntry) return props.historyEntry.workspace_root ?? null;
    const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
    return entry?.workspace_root ?? null;
  });

  const diagnosticsTaskId = computed<string | null>(() =>
    props.historyEntry ? (props.historyEntry.taskId ?? null) : (ui.taskId ?? null),
  );

  const canContinue = computed(() => {
    if (!ui.taskId) return false;
    if (isRunning.value) return false;
    const status = ui.taskStatus;
    return (
      status === "failed" ||
      status === "blocked" ||
      status === "completed_with_failures" ||
      status === "awaiting_human" ||
      status === "awaiting_shell_confirm" ||
      status === "awaiting_manual_shell"
    );
  });

  const canRestart = computed(() => {
    if (!ui.taskId) return false;
    if (isRunning.value) return false;
    const status = ui.taskStatus;
    return (
      status === "completed" ||
      status === "completed_with_failures" ||
      status === "failed" ||
      status === "cancelled"
    );
  });

  const filterOptions = computed<Array<{ key: LogFilter; label: string }>>(() => [
    { key: "all", label: t("runLive.logFilter.all") },
    { key: "errors", label: t("runLive.logFilter.errors") },
    { key: "files", label: t("runLive.logFilter.files") },
  ]);

  const {
    filteredEvents,
    stepRows,
    totalSteps,
    currentStepIndex,
    classifyEvent,
    formatTime,
  } = useRunLiveSteps({ ui, controller, isRunning, logFilter, history: historySource });

  function stepStateLabel(state: StepState): string {
    return t(`runLive.${state}Step`);
  }

  const title = computed(() => t("runLive.title"));
  const subtitle = computed(() =>
    totalSteps.value
      ? t("runLive.subtitleStep", {
          current: currentStepIndex.value,
          total: totalSteps.value,
        })
      : "",
  );

  function onStop(): void {
    void controller.onStopRun();
  }

  function onContinueCurrent(): void {
    void controller.onContinuePipeline([]);
  }

  function onHumanResume(feedback: string): void {
    void controller.onHumanResume(feedback);
  }

  function onConfirmShell(approved: boolean): void {
    void controller.onConfirmShell(approved);
  }

  function onConfirmManualShell(done: boolean): void {
    void controller.onConfirmManualShell(done);
  }

  function onRetry(fromBeginning: boolean): void {
    void controller.onRetry(fromBeginning);
  }

  function onContinuePipeline(additionalSteps: string[]): void {
    void controller.onContinuePipeline(additionalSteps);
  }

  function onRestart(): void {
    void controller.onRetry(true);
  }

  return {
    ui,
    controller,
    t,
    logFilter,
    isHistoryView,
    isRunning,
    hasActiveTask,
    currentWorkspaceRoot,
    diagnosticsTaskId,
    canContinue,
    canRestart,
    filterOptions,
    filteredEvents,
    stepRows,
    classifyEvent,
    formatTime,
    stepStateLabel,
    title,
    subtitle,
    onStop,
    onContinueCurrent,
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
    onRestart,
  };
}
