import { computed, readonly, ref } from "vue";

import type { RunDiagnostics } from "@/shared/model/run-diagnostics-types";
import { getRunDiagnostics } from "@/shared/api/endpoints/run-diagnostics";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const diagnostics = ref<RunDiagnostics | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetRunDiagnostics(): void {
  diagnostics.value = null;
  loading.value = false;
  lastError.value = null;
}

export interface RefreshInput {
  taskId: string;
  workspaceRoot: string;
}

export function useRunDiagnostics() {
  async function refresh(input: RefreshInput): Promise<void> {
    if (loading.value) return;
    const taskId = input.taskId.trim();
    const workspaceRoot = input.workspaceRoot.trim();
    if (!taskId || !workspaceRoot) return;
    loading.value = true;
    lastError.value = null;
    try {
      diagnostics.value = await getRunDiagnostics({ taskId, workspaceRoot });
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("run-diagnostics: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    diagnostics: readonly(diagnostics),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => diagnostics.value !== null),
    refresh,
    clear: resetRunDiagnostics,
  };
}
