import { readonly, ref } from "vue";

import { getIndexStatus, type IndexStatus } from "@/shared/api/endpoints/index-status";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const status = ref<IndexStatus | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

function resetIndexStatus(): void {
  status.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useIndexStatus() {
  async function refresh(workspaceRoot: string): Promise<void> {
    const trimmedRoot = workspaceRoot.trim();
    if (!trimmedRoot) {
      status.value = null;
      return;
    }
    if (loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      status.value = (await getIndexStatus(trimmedRoot)) ?? null;
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("index-status: refresh failed", { error: message });
      lastError.value = message;
      status.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    status: readonly(status),
    loading: readonly(loading),
    lastError: readonly(lastError),
    refresh,
    clear: resetIndexStatus,
  };
}
