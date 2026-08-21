import { computed, readonly, ref } from "vue";

import type { ArtefactCatalogueReport } from "@/shared/model/artefact-catalogue-types";
import { getArtefactReport } from "@/shared/api/endpoints/artefact-catalogue";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const report = ref<ArtefactCatalogueReport | null>(null);
const loading = ref(false);
const lastError = ref<string | null>(null);

export function resetArtefactCatalogue(): void {
  report.value = null;
  loading.value = false;
  lastError.value = null;
}

export interface RefreshArtefactInput {
  scenario: string;
  workspaceRoot: string;
}

export function useArtefactCatalogue() {
  async function refresh(input: RefreshArtefactInput): Promise<void> {
    const trimmedScenario = input.scenario.trim();
    const trimmedRoot = input.workspaceRoot.trim();
    if (!trimmedScenario || !trimmedRoot) return;
    loading.value = true;
    lastError.value = null;
    try {
      report.value = await getArtefactReport({
        scenario: trimmedScenario,
        workspaceRoot: trimmedRoot,
      });
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error ? requestError.message : String(requestError);
      frontendLogger.warn("artefact-catalogue: refresh failed", {
        error: message,
      });
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
    refresh,
    clear: resetArtefactCatalogue,
  };
}
