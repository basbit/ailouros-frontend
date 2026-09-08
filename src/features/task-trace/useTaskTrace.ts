import { readonly, ref } from "vue";

import { getTaskTrace, type TaskTrace } from "@/shared/api/endpoints/trace";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const trace = ref<TaskTrace | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

function resetTaskTrace(): void {
  trace.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useTaskTrace() {
  async function refresh(taskId: string): Promise<void> {
    const id = taskId.trim();
    if (!id) {
      trace.value = null;
      return;
    }
    if (loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      trace.value = (await getTaskTrace(id)) ?? null;
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("task-trace: refresh failed", { error: message });
      lastError.value = message;
      trace.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    trace: readonly(trace),
    loading: readonly(loading),
    lastError: readonly(lastError),
    refresh,
    clear: resetTaskTrace,
  };
}
