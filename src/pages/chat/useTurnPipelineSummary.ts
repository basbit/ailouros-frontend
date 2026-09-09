import { computed, ref, watch } from "vue";
import {
  useRunLiveSteps,
  type EventRow,
  type HistorySource,
  type LogFilter,
} from "@/pages/run/useRunLiveSteps";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";
import { useUiStore } from "@/shared/store/ui";
import { useInjectedSwarmRunController } from "@/features/swarm-run";
import { isTaskActive } from "@/shared/lib/task-status";
import type {
  TurnPipelineStep,
  TurnPipelineLogLine,
  TurnPipelineSummary,
} from "@/entities/pipeline-progress/model/types";

interface TurnPipelineSummaryOptions {
  /** Conversation turn's task id; empty for turns never attached to a run. */
  taskId: () => string | null;
  /**
   * True while this turn is the run the page is currently driving: the live
   * ui-store (WS ticks) is the source. False for past turns — their snapshot
   * is loaded from the server once per task id.
   */
  isLive: () => boolean;
}

/**
 * Per-turn pipeline progress for the chat page. Live turns read the shared
 * ui-store exactly like the Run page does; finished turns load their event
 * history + step list from the task snapshot, the same path the history
 * detail page uses.
 */
export function useTurnPipelineSummary(
  options: TurnPipelineSummaryOptions,
): TurnPipelineSummary {
  const ui = useUiStore();
  const controller = useInjectedSwarmRunController();

  const historyEvents = ref<EventRow[]>([]);
  const historySteps = ref<string[]>([]);
  const historyFailedStep = ref<string>("");
  const historyStatus = ref<string>("");
  let loadedTaskId = "";

  watch(
    () => (options.isLive() ? null : options.taskId()),
    (taskId) => {
      if (!taskId || taskId === loadedTaskId) return;
      loadedTaskId = taskId;
      void loadSnapshot(taskId);
    },
    { immediate: true },
  );

  async function loadSnapshot(taskId: string): Promise<void> {
    try {
      const snapshot = await getLegacyTaskSnapshot(taskId);
      if (options.isLive() || options.taskId() !== taskId) return;
      historyEvents.value = Array.isArray(snapshot.history)
        ? (snapshot.history as EventRow[])
        : [];
      historySteps.value = Array.isArray(snapshot.pipeline_steps)
        ? snapshot.pipeline_steps.map((step) => String(step))
        : [];
      historyFailedStep.value = (snapshot.failed_step ?? "").trim();
      historyStatus.value = (snapshot.status ?? "").trim();
    } catch {
      historyEvents.value = [];
      historySteps.value = [];
      historyFailedStep.value = "";
      historyStatus.value = "";
    }
  }

  const isLive = computed(() => options.isLive());

  const history = computed<HistorySource | null>(() => {
    if (isLive.value) return null;
    return {
      pipelineSteps: historySteps.value,
      events: historyEvents.value,
      failedStep: historyFailedStep.value,
    };
  });

  const isRunning = computed(() =>
    isLive.value ? controller.isRunning.value : isTaskActive(historyStatus.value),
  );

  const logFilter = ref<LogFilter>("all");

  const stepsView = useRunLiveSteps({
    ui,
    controller,
    // The steps view must not treat a finished (non-live) turn as an active
    // run even while a different run is live on the page.
    isRunning: computed(() => (isLive.value ? controller.isRunning.value : false)),
    logFilter,
    history,
  });

  const steps = computed<TurnPipelineStep[]>(() =>
    stepsView.stepRows.value.map((row) => ({ id: row.id, state: row.state })),
  );

  const totalSteps = computed(() => stepsView.totalSteps.value);

  const completedCount = computed(
    () => steps.value.filter((step) => step.state === "completed").length,
  );

  const failedCount = computed(
    () => steps.value.filter((step) => step.state === "failed").length,
  );

  const activeStep = computed<string | null>(() => {
    const active = steps.value.find((step) => step.state === "active");
    return active?.id ?? null;
  });

  const status = computed<string>(() => {
    if (isLive.value) return ui.taskStatus ?? "";
    return historyStatus.value;
  });

  const events = computed<EventRow[]>(() => {
    const source = history.value;
    if (source) return source.events;
    return ui.taskHistory as EventRow[];
  });

  const latestLog = computed<string>(() => {
    const rows = events.value;
    const last = rows.length ? rows[rows.length - 1] : null;
    const text = (last?.message ?? "").trim();
    if (!text) return "";
    const prefix = last?.agent ? `${last.agent}: ` : "";
    return `${prefix}${text}`;
  });

  const logLines = computed<TurnPipelineLogLine[]>(() => events.value.slice(-3));

  const progressPct = computed<number>(() => {
    if (!totalSteps.value) return 0;
    const done = completedCount.value;
    return Math.min(100, Math.round((done / totalSteps.value) * 100));
  });

  return {
    steps,
    completedCount,
    failedCount,
    totalSteps,
    activeStep,
    latestLog,
    logLines,
    progressPct,
    status,
    isRunning,
  };
}
