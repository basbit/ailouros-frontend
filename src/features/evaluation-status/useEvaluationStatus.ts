import { computed, readonly, ref } from "vue";

import type { EvaluationStatus } from "@/entities/evaluation-status";
import { getEvaluationStatus } from "@/shared/api/endpoints/evaluation-status";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const status = ref<EvaluationStatus | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetEvaluationStatus(): void {
  status.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useEvaluationStatus() {
  async function refresh(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      status.value = await getEvaluationStatus();
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("evaluation-status: refresh failed", {
        error: message,
      });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    status: readonly(status),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => status.value !== null),
    refresh,
    clear: resetEvaluationStatus,
  };
}
