import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type ComputedRef,
  type Ref,
} from "vue";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";
import { isTaskActive } from "@/shared/lib/task-status";
import type { HistoryEntry } from "@/shared/store/ui";

export interface RemoteEvent {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

export interface StepRow {
  id: string;
  state: "completed" | "failed" | "skipped" | "pending";
  durationMs: number | null;
  messageCount: number;
}

interface HistoryDetailLoadOptions {
  entry: ComputedRef<HistoryEntry | null>;
  isResumeAvailable: Ref<boolean>;
  resumeStepId: Ref<string>;
  loadResumeOptions: (taskId: string) => Promise<void> | void;
}

export function useHistoryDetailLoad({
  entry,
  isResumeAvailable,
  resumeStepId,
  loadResumeOptions,
}: HistoryDetailLoadOptions) {
  const remoteEvents = ref<RemoteEvent[]>([]);
  const remoteEventsLoading = ref(false);
  const remoteEventsError = ref<string | null>(null);
  const eventsViewMode = ref<"preview" | "raw">("preview");
  /** Steps the run actually executed, per the task snapshot (may differ from
   * the steps the entry was launched with after scenario resolution). */
  const remoteSteps = ref<string[]>([]);
  const remoteFailedStep = ref<string>("");
  /** Authoritative run status from the backend snapshot. The locally stored
   * entry status goes stale when the run finishes while the tab is closed. */
  const remoteStatus = ref<string>("");
  /** What a paused run is waiting for, as its own pipeline.json recorded it.
   * The live gate text in the `ui` store belongs to this browser session only,
   * so History had nothing to show for a run it did not start itself. */
  const remotePauseDetail = ref<string>("");
  /** The step that asked. */
  const remoteHumanStep = ref<string>("");

  async function loadRemoteEvents(taskId: string): Promise<void> {
    remoteEventsLoading.value = true;
    remoteEventsError.value = null;
    try {
      const snapshot = await getLegacyTaskSnapshot(taskId);
      remoteEvents.value = Array.isArray(snapshot.history) ? snapshot.history : [];
      remoteSteps.value = Array.isArray(snapshot.pipeline_steps)
        ? snapshot.pipeline_steps.map((step) => String(step))
        : [];
      remoteFailedStep.value = (snapshot.failed_step ?? "").trim();
      remoteStatus.value = (snapshot.status ?? "").trim();
      remoteHumanStep.value = (snapshot.human_approval_step ?? "").trim();
      // `error` carries the pause detail on a paused run and the failure on a
      // failed one — only the first is a question for the operator to answer.
      remotePauseDetail.value =
        remoteStatus.value === "awaiting_human" && typeof snapshot.error === "string"
          ? snapshot.error.trim()
          : "";
    } catch (error) {
      remoteEventsError.value = error instanceof Error ? error.message : String(error);
      remoteEvents.value = [];
      remoteSteps.value = [];
      remoteFailedStep.value = "";
      remoteStatus.value = "";
      remotePauseDetail.value = "";
      remoteHumanStep.value = "";
    } finally {
      remoteEventsLoading.value = false;
    }
  }

  /**
   * The snapshot is a point-in-time read, so a run still in flight would freeze
   * at whatever it had done when the page opened — steps stuck "pending" and no
   * new log lines, while the chat view kept moving. Poll until the run reaches a
   * terminal status, then stop.
   */
  const REFRESH_INTERVAL_MS = 3000;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  function stopPolling(): void {
    if (refreshTimer === null) return;
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  function isViewedRunActive(): boolean {
    const status = (remoteStatus.value || entry.value?.status || "").trim();
    // An unknown status means the first snapshot has not landed yet; keep
    // polling rather than deciding the run is finished.
    return !status || isTaskActive(status);
  }

  function startPolling(): void {
    stopPolling();
    const taskId = entry.value?.taskId;
    if (!taskId || !isViewedRunActive()) return;
    refreshTimer = setInterval(() => {
      const currentTaskId = entry.value?.taskId;
      if (!currentTaskId || !isViewedRunActive()) {
        stopPolling();
        return;
      }
      void loadRemoteEvents(currentTaskId);
    }, REFRESH_INTERVAL_MS);
  }

  watch(
    () => entry.value?.taskId,
    (taskId) => {
      stopPolling();
      remoteEvents.value = [];
      remoteEventsError.value = null;
      remoteSteps.value = [];
      remoteFailedStep.value = "";
      remoteStatus.value = "";
      remotePauseDetail.value = "";
      remoteHumanStep.value = "";
      isResumeAvailable.value = false;
      resumeStepId.value = "";
      if (taskId) {
        void loadRemoteEvents(taskId).then(startPolling);
        void loadResumeOptions(taskId);
      }
    },
    { immediate: true },
  );

  // The page lives inside <keep-alive>: onBeforeUnmount alone would leave the
  // poll running against the backend for the rest of the session.
  onActivated(startPolling);
  onDeactivated(stopPolling);
  onBeforeUnmount(stopPolling);

  const stepEventIndex = computed<Map<string, RemoteEvent[]>>(() => {
    const map = new Map<string, RemoteEvent[]>();
    for (const event of remoteEvents.value) {
      const agent = event.agent ?? "";
      if (!agent) continue;
      const bucket = map.get(agent);
      if (bucket) bucket.push(event);
      else map.set(agent, [event]);
    }
    return map;
  });

  const stepRows = computed<StepRow[]>(() => {
    const steps = entry.value?.pipeline_steps ?? [];
    return steps.map((stepId) => {
      const events = stepEventIndex.value.get(stepId) ?? [];
      let state: StepRow["state"] = events.length ? "completed" : "pending";
      let firstTs: number | null = null;
      let lastTs: number | null = null;
      for (const event of events) {
        if (event.status === "failed" || event.status === "error") {
          state = "failed";
        }
        const ts = event.timestamp ? Date.parse(event.timestamp) : NaN;
        if (!Number.isNaN(ts)) {
          if (firstTs === null || ts < firstTs) firstTs = ts;
          if (lastTs === null || ts > lastTs) lastTs = ts;
        }
      }
      const durationMs = firstTs !== null && lastTs !== null ? lastTs - firstTs : null;
      return { id: stepId, state, durationMs, messageCount: events.length };
    });
  });

  return {
    remoteEvents,
    remoteEventsLoading,
    remoteEventsError,
    remoteSteps,
    remoteFailedStep,
    remoteStatus,
    remotePauseDetail,
    remoteHumanStep,
    eventsViewMode,
    stepRows,
    loadRemoteEvents,
  };
}
