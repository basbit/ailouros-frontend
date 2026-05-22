import { ref, type Ref } from "vue";
import { ApiError, httpGet } from "@/shared/api/http";
import type {
  ConversationHistoryResponse,
  ConversationMessage,
} from "./conversation-types";

export interface UseConversationHistoryState {
  messages: Ref<ConversationMessage[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  sharedHistoryEnabled: Ref<boolean | null>;
  notImplemented: Ref<boolean>;
  load: (taskId: string) => Promise<void>;
  reset: () => void;
}

export function useConversationHistory(): UseConversationHistoryState {
  const messages = ref<ConversationMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sharedHistoryEnabled = ref<boolean | null>(null);
  const notImplemented = ref(false);

  async function load(taskId: string): Promise<void> {
    if (!taskId) return;
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const data = await httpGet<ConversationHistoryResponse>(
        `/v1/conversation/${encodeURIComponent(taskId)}`,
      );
      messages.value = data.messages ?? [];
      sharedHistoryEnabled.value =
        typeof data.shared_history_enabled === "boolean"
          ? data.shared_history_enabled
          : null;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        messages.value = [];
        sharedHistoryEnabled.value = null;
        return;
      }
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Failed to load conversation history.";
      }
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    messages.value = [];
    loading.value = false;
    error.value = null;
    sharedHistoryEnabled.value = null;
    notImplemented.value = false;
  }

  return {
    messages,
    loading,
    error,
    sharedHistoryEnabled,
    notImplemented,
    load,
    reset,
  };
}
