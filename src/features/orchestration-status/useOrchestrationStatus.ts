import { computed, readonly, ref } from "vue";

import type { OrchestrationStatusSnapshot } from "@/entities/orchestration-status";
import { getOrchestrationStatus } from "@/shared/api/endpoints/orchestration-status";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const snapshot = ref<OrchestrationStatusSnapshot | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);
const lastFetchedAt = ref<number | null>(null);

export function resetOrchestrationStatus(): void {
  snapshot.value = null;
  loading.value = false;
  lastError.value = null;
  lastFetchedAt.value = null;
}

export interface RefreshInput {
  scenario: string;
  workspaceRoot?: string | null;
}

export function useOrchestrationStatus() {
  async function refresh(input: RefreshInput): Promise<void> {
    const trimmedScenario = input.scenario.trim();
    if (!trimmedScenario) return;
    loading.value = true;
    lastError.value = null;
    try {
      snapshot.value = await getOrchestrationStatus({
        scenario: trimmedScenario,
        workspaceRoot: input.workspaceRoot ?? null,
      });
      lastFetchedAt.value = Date.now();
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("orchestration-status: refresh failed", {
        error: message,
      });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    snapshot: readonly(snapshot),
    loading: readonly(loading),
    lastError: readonly(lastError),
    lastFetchedAt: readonly(lastFetchedAt),
    visible: computed(() => snapshot.value !== null),
    refresh,
    clear: resetOrchestrationStatus,
  };
}
