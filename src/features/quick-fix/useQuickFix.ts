import { computed, readonly, ref } from "vue";

import type { QuickFixDecision } from "@/entities/quick-fix";
import { evaluateQuickFix } from "@/shared/api/endpoints/quick-fix";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const decision = ref<QuickFixDecision | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetQuickFix(): void {
  decision.value = null;
  loading.value = false;
  lastError.value = null;
}

export interface EvaluateInput {
  description: string;
  targetFiles: readonly string[];
  estimatedLoc: number;
}

export function useQuickFix() {
  async function run(input: EvaluateInput): Promise<void> {
    const trimmedDescription = input.description.trim();
    const cleanedFiles = input.targetFiles
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (!trimmedDescription || cleanedFiles.length === 0) return;
    loading.value = true;
    lastError.value = null;
    try {
      decision.value = await evaluateQuickFix({
        description: trimmedDescription,
        targetFiles: cleanedFiles,
        estimatedLoc: input.estimatedLoc,
      });
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("quick-fix: evaluate failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    decision: readonly(decision),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => decision.value !== null),
    run,
    clear: resetQuickFix,
  };
}
