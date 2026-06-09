import { computed, readonly, ref } from "vue";

import type { FollowUpSuggestion } from "@/entities/follow-up";
import {
  getFollowUpStatus,
  generateFollowUps,
  type FollowUpStatus,
} from "@/shared/api/endpoints/follow-up";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const suggestions = ref<FollowUpSuggestion[]>([]);
const status = ref<FollowUpStatus | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);
const lastQuery = ref<string>("");

export function resetFollowUpChips(): void {
  suggestions.value = [];
  status.value = null;
  loading.value = false;
  lastError.value = null;
  lastQuery.value = "";
}

export interface GenerateInput {
  query: string;
  answer?: string;
  contexts?: string[];
}

export function useFollowUpChips() {
  async function ensureStatus(): Promise<FollowUpStatus> {
    if (status.value) return status.value;
    try {
      status.value = await getFollowUpStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      frontendLogger.warn("follow-up-chips: status failed", {
        error: message,
      });
      status.value = { enabled: false, count: 0 };
      lastError.value = message;
    }
    return status.value;
  }

  async function generate(input: GenerateInput): Promise<void> {
    const trimmed = input.query.trim();
    if (!trimmed) return;
    lastError.value = null;
    loading.value = true;
    lastQuery.value = trimmed;
    try {
      const next = await generateFollowUps({ ...input, query: trimmed });
      suggestions.value = next;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      frontendLogger.warn("follow-up-chips: generate failed", {
        error: message,
      });
      lastError.value = message;
      suggestions.value = [];
    } finally {
      loading.value = false;
    }
  }

  function clear(): void {
    suggestions.value = [];
    lastError.value = null;
    lastQuery.value = "";
  }

  return {
    suggestions: readonly(suggestions),
    status: readonly(status),
    loading: readonly(loading),
    lastError: readonly(lastError),
    lastQuery: readonly(lastQuery),
    visible: computed(() => suggestions.value.length > 0),
    ensureStatus,
    generate,
    clear,
  };
}
