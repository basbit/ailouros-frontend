import { computed, readonly, ref } from "vue";

import type { RedTeamCorpus } from "@/entities/red-team";
import { getRedTeamCorpus } from "@/shared/api/endpoints/red-team";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const corpus = ref<RedTeamCorpus | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetRedTeamCorpus(): void {
  corpus.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useRedTeamCorpus() {
  async function refresh(): Promise<void> {
    if (loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      corpus.value = await getRedTeamCorpus();
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("red-team: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    corpus: readonly(corpus),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => corpus.value !== null),
    refresh,
    clear: resetRedTeamCorpus,
  };
}
