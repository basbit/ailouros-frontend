import { computed, readonly, ref } from "vue";

import type { RetrievalSettings } from "@/entities/retrieval-settings";
import { getRetrievalSettings } from "@/shared/api/endpoints/retrieval-settings";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const settings = ref<RetrievalSettings | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetRetrievalSettings(): void {
  settings.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useRetrievalSettings() {
  async function refresh(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      settings.value = (await getRetrievalSettings()) ?? null;
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("retrieval-settings: refresh failed", {
        error: message,
      });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => settings.value !== null),
    refresh,
    clear: resetRetrievalSettings,
  };
}
