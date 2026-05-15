import { ref } from "vue";
import type { Ref } from "vue";
import { ApiError } from "@/shared/api/client";
import { getScenarioEstimate } from "@/shared/api/endpoints/scenarios";
import type { ScenarioEstimate } from "@/shared/model/scenario-types";

export interface ScenarioEstimateApi {
  estimate: Ref<ScenarioEstimate | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  load: (scenarioId: string | null) => Promise<void>;
  reset: () => void;
}

export function useScenarioEstimate(): ScenarioEstimateApi {
  const estimate = ref<ScenarioEstimate | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  let token = 0;

  function reset(): void {
    token++;
    estimate.value = null;
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
  }

  async function load(scenarioId: string | null): Promise<void> {
    if (!scenarioId) {
      reset();
      return;
    }
    const myToken = ++token;
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const result = await getScenarioEstimate(scenarioId);
      if (myToken !== token) return;
      estimate.value = result;
      if (result.total_seconds === null) {
        notImplemented.value = true;
      }
    } catch (err) {
      if (myToken !== token) return;
      estimate.value = null;
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        error.value = null;
      } else {
        error.value = err instanceof Error ? err.message : String(err);
      }
    } finally {
      if (myToken === token) loading.value = false;
    }
  }

  return { estimate, loading, error, notImplemented, load, reset };
}
