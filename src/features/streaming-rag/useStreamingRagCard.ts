import { computed } from "vue";

import {
  resetRetrievalEvents,
  retrievalHistory,
  retrievalLatest,
} from "@/shared/lib/streaming-rag-events";

export function useStreamingRagCard() {
  return {
    latest: retrievalLatest,
    history: retrievalHistory,
    visible: computed(() => retrievalLatest.value !== null),
    clear: resetRetrievalEvents,
  };
}

export { resetRetrievalEvents as resetStreamingRagCard } from "@/shared/lib/streaming-rag-events";
export { recordRetrievalDone } from "@/shared/lib/streaming-rag-events";
