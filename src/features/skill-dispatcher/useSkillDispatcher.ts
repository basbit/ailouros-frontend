import { computed, readonly, ref } from "vue";

import type { SkillDispatchDecision } from "@/entities/skill-dispatch";
import { dispatchSkill } from "@/shared/api/endpoints/skill-dispatcher";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const decision = ref<SkillDispatchDecision | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetSkillDispatcher(): void {
  decision.value = null;
  loading.value = false;
  lastError.value = null;
}

export interface DispatchInput {
  scenario: string;
  phase: string;
  userInput: string;
}

export function useSkillDispatcher() {
  async function run(input: DispatchInput): Promise<void> {
    const trimmedInput = input.userInput.trim();
    if (!trimmedInput) return;
    loading.value = true;
    lastError.value = null;
    try {
      decision.value = await dispatchSkill({
        scenario: input.scenario,
        phase: input.phase,
        userInput: trimmedInput,
      });
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("skill-dispatcher: dispatch failed", {
        error: message,
      });
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
    clear: resetSkillDispatcher,
  };
}
