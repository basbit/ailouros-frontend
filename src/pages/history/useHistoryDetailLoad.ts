import { computed, ref, watch, type ComputedRef, type Ref } from "vue";
import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";
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

interface ConversationLike {
  reset: () => void;
  load: (taskId: string) => Promise<void> | void;
}

interface HistoryDetailLoadOptions {
  entry: ComputedRef<HistoryEntry | null>;
  conversationState: ConversationLike;
  resumeAvailable: Ref<boolean>;
  resumeStepId: Ref<string>;
  loadResumeOptions: (taskId: string) => Promise<void> | void;
}

export function useHistoryDetailLoad({
  entry,
  conversationState,
  resumeAvailable,
  resumeStepId,
  loadResumeOptions,
}: HistoryDetailLoadOptions) {
  const remoteEvents = ref<RemoteEvent[]>([]);
  const remoteEventsLoading = ref(false);
  const remoteEventsError = ref<string | null>(null);
  const eventsViewMode = ref<"preview" | "raw">("preview");

  async function loadRemoteEvents(taskId: string): Promise<void> {
    remoteEventsLoading.value = true;
    remoteEventsError.value = null;
    try {
      const snapshot = await getLegacyTaskSnapshot(taskId);
      remoteEvents.value = Array.isArray(snapshot.history) ? snapshot.history : [];
    } catch (error) {
      remoteEventsError.value = error instanceof Error ? error.message : String(error);
      remoteEvents.value = [];
    } finally {
      remoteEventsLoading.value = false;
    }
  }

  watch(
    () => entry.value?.taskId,
    (taskId) => {
      remoteEvents.value = [];
      remoteEventsError.value = null;
      resumeAvailable.value = false;
      resumeStepId.value = "";
      conversationState.reset();
      if (taskId) {
        void loadRemoteEvents(taskId);
        void conversationState.load(taskId);
        void loadResumeOptions(taskId);
      }
    },
    { immediate: true },
  );

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
    eventsViewMode,
    stepRows,
  };
}
