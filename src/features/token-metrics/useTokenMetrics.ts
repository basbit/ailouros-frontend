import { readonly, ref } from "vue";

import { httpGet } from "@/shared/api/http";
import { parseTokenMetricsPayload, type TokenMetrics } from "./model/types";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const metrics = ref<TokenMetrics | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

function resetTokenMetrics(): void {
  metrics.value = null;
  loading.value = false;
  lastError.value = null;
}

interface RefreshInput {
  taskId: string;
}

export function useTokenMetrics() {
  async function refresh(input: RefreshInput): Promise<void> {
    if (loading.value) return;
    const taskId = input.taskId.trim();
    if (!taskId) return;
    loading.value = true;
    lastError.value = null;
    try {
      const raw = await httpGet<Record<string, unknown>>(
        `/v1/tasks/${encodeURIComponent(taskId)}`,
      );
      metrics.value = parseTokenMetricsPayload(raw);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("token-metrics: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    metrics: readonly(metrics),
    loading: readonly(loading),
    lastError: readonly(lastError),
    refresh,
    clear: resetTokenMetrics,
  };
}
