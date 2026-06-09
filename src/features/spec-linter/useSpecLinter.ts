import { computed, readonly, ref } from "vue";

import type { SpecLintReport } from "@/entities/spec-lint";
import { lintSpec } from "@/shared/api/endpoints/spec-linter";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const report = ref<SpecLintReport | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetSpecLinter(): void {
  report.value = null;
  loading.value = false;
  lastError.value = null;
}

export interface RunLintInput {
  scenario: string;
  specText: string;
}

export function useSpecLinter() {
  async function run(input: RunLintInput): Promise<void> {
    const trimmedScenario = input.scenario.trim();
    const trimmedSpec = input.specText.trim();
    if (!trimmedScenario || !trimmedSpec) return;
    loading.value = true;
    lastError.value = null;
    try {
      report.value = await lintSpec({
        scenario: trimmedScenario,
        specText: trimmedSpec,
      });
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("spec-linter: run failed", { error: message });
      lastError.value = message;
    } finally {
      loading.value = false;
    }
  }

  return {
    report: readonly(report),
    loading: readonly(loading),
    lastError: readonly(lastError),
    visible: computed(() => report.value !== null),
    run,
    clear: resetSpecLinter,
  };
}
