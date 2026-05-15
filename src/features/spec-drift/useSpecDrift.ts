import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  generateFromSpec,
  getSpecDrift,
  type SpecCodegenOutcome,
  type SpecDriftReport,
} from "@/shared/api/endpoints/spec";

export interface UseSpecDriftState {
  report: Ref<SpecDriftReport | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  regenerating: Ref<Record<string, boolean>>;
  regenerateError: Ref<string | null>;
  lastOutcome: Ref<SpecCodegenOutcome | null>;
  load: (workspaceRoot: string) => Promise<void>;
  regenerate: (specId: string) => Promise<SpecCodegenOutcome | null>;
  reset: () => void;
}

const EMPTY_REPORT: SpecDriftReport = {
  stale_code: [],
  stale_specs: [],
  aged_keep_regions: [],
};

function normalize(
  payload: Partial<SpecDriftReport> | null | undefined,
): SpecDriftReport {
  if (!payload) return { ...EMPTY_REPORT };
  return {
    stale_code: payload.stale_code ?? [],
    stale_specs: payload.stale_specs ?? [],
    aged_keep_regions: payload.aged_keep_regions ?? [],
  };
}

export function useSpecDrift(): UseSpecDriftState {
  const report = ref<SpecDriftReport | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const regenerating = ref<Record<string, boolean>>({});
  const regenerateError = ref<string | null>(null);
  const lastOutcome = ref<SpecCodegenOutcome | null>(null);

  async function load(workspaceRoot: string): Promise<void> {
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const data = await getSpecDrift(workspaceRoot);
      report.value = normalize(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        report.value = null;
        return;
      }
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Failed to load drift report.";
      }
    } finally {
      loading.value = false;
    }
  }

  async function regenerate(specId: string): Promise<SpecCodegenOutcome | null> {
    if (!specId) return null;
    regenerateError.value = null;
    regenerating.value = { ...regenerating.value, [specId]: true };
    try {
      const outcome = await generateFromSpec(specId);
      lastOutcome.value = outcome;
      return outcome;
    } catch (err) {
      if (err instanceof Error) {
        regenerateError.value = err.message;
      } else {
        regenerateError.value = "Failed to trigger codegen.";
      }
      return null;
    } finally {
      const next = { ...regenerating.value };
      delete next[specId];
      regenerating.value = next;
    }
  }

  function reset(): void {
    report.value = null;
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    regenerating.value = {};
    regenerateError.value = null;
    lastOutcome.value = null;
  }

  return {
    report,
    loading,
    error,
    notImplemented,
    regenerating,
    regenerateError,
    lastOutcome,
    load,
    regenerate,
    reset,
  };
}
