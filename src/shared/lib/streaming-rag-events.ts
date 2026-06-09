import { readonly, ref } from "vue";

import type { RetrievalDoneEvent } from "@/shared/model/streaming-rag-types";

const HISTORY_MAX_ENTRIES = 12;

const latestEvent = ref<RetrievalDoneEvent | null>(null);
const historyEvents = ref<RetrievalDoneEvent[]>([]);

export function recordRetrievalDone(event: RetrievalDoneEvent): void {
  if (latestEvent.value) {
    historyEvents.value = [latestEvent.value, ...historyEvents.value].slice(
      0,
      HISTORY_MAX_ENTRIES,
    );
  }
  latestEvent.value = event;
}

export function resetRetrievalEvents(): void {
  latestEvent.value = null;
  historyEvents.value = [];
}

export const retrievalLatest = readonly(latestEvent);
export const retrievalHistory = readonly(historyEvents);
