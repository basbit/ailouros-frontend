import { readonly, ref } from "vue";
import { httpGet, httpPost } from "@/shared/api/http";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import { parseTaskBudgetPayload, type TaskBudgetInfo } from "./model/types";

const budget = ref<TaskBudgetInfo | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

function resetTaskBudget(): void {
  budget.value = null;
  loading.value = false;
  lastError.value = null;
}

export function useTaskBudget() {
  async function refresh(taskId: string): Promise<void> {
    const cleanId = taskId.trim();
    if (!cleanId || loading.value) return;
    loading.value = true;
    lastError.value = null;
    try {
      const raw = await httpGet<Record<string, unknown>>(
        `/v1/tasks/${encodeURIComponent(cleanId)}/budget`,
      );
      budget.value = parseTaskBudgetPayload(raw);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("task-budget: refresh failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  async function increaseBudget(
    taskId: string,
    addUsd: number,
    addTokens: number = 0,
  ): Promise<boolean> {
    const cleanId = taskId.trim();
    if (!cleanId) return false;
    loading.value = true;
    lastError.value = null;
    try {
      const result = await httpPost<{ ok: boolean; budget?: Record<string, unknown> }>(
        `/v1/tasks/${encodeURIComponent(cleanId)}/budget/increase`,
        { add_usd: addUsd, add_tokens: addTokens },
      );
      if (result.budget) {
        budget.value = parseTaskBudgetPayload(result.budget);
      }
      return true;
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("task-budget: increase failed", { error: message });
      lastError.value = message;
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    budget: readonly(budget),
    loading: readonly(loading),
    lastError: readonly(lastError),
    refresh,
    increaseBudget,
    clear: resetTaskBudget,
  };
}
