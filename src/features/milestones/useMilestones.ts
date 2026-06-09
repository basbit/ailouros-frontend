import { computed, readonly, ref } from "vue";

import type { Milestone } from "@/entities/milestone";
import { listMilestones } from "@/shared/api/endpoints/milestones";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const milestones = ref<Milestone[]>([]);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetMilestones(): void {
  milestones.value = [];
  loading.value = false;
  lastError.value = null;
}

export function useMilestones() {
  async function refresh(workspaceRoot: string): Promise<void> {
    const trimmedRoot = workspaceRoot.trim();
    if (!trimmedRoot) return;
    loading.value = true;
    lastError.value = null;
    try {
      milestones.value = await listMilestones(trimmedRoot);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("milestones: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    milestones: readonly(milestones),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => milestones.value.length > 0),
    refresh,
    clear: resetMilestones,
  };
}
