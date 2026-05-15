import { ref, type Ref } from "vue";
import { ApiError, httpGet } from "@/shared/api/http";
import type { SpecValidationResult } from "./spec-types";

export interface UseSpecValidationState {
  result: Ref<SpecValidationResult | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  /** Endpoint reported 404 — backend route not yet wired in. */
  notImplemented: Ref<boolean>;
  load: (specId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Loads a ``SpecValidationResult`` from
 * ``GET /v1/spec/{id}/validate``. The endpoint is not yet implemented
 * on the backend; this composable degrades to ``notImplemented`` on 404.
 */
export function useSpecValidation(
  initial: SpecValidationResult | null = null,
): UseSpecValidationState {
  const result = ref<SpecValidationResult | null>(initial);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);

  async function load(specId: string): Promise<void> {
    if (!specId) return;
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const data = await httpGet<SpecValidationResult>(
        `/v1/spec/${encodeURIComponent(specId)}/validate`,
      );
      result.value = data;
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (err instanceof ApiError && status === 404) {
        notImplemented.value = true;
        result.value = null;
        return;
      }
      if (typeof status === "number" && status === 404) {
        notImplemented.value = true;
        result.value = null;
        return;
      }
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = "Failed to load validation result.";
      }
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    result.value = null;
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
  }

  return { result, loading, error, notImplemented, load, reset };
}
