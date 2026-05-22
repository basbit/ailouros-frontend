import { ref, type Ref } from "vue";
import { ApiError, httpPost } from "@/shared/api/http";
import type { SpecValidationResult } from "./spec-types";

export interface UseSpecValidationState {
  result: Ref<SpecValidationResult | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  load: (specId: string, workspaceRoot?: string | null) => Promise<void>;
  reset: () => void;
}

export function useSpecValidation(
  initial: SpecValidationResult | null = null,
): UseSpecValidationState {
  const result = ref<SpecValidationResult | null>(initial);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);

  async function load(specId: string, workspaceRoot?: string | null): Promise<void> {
    if (!specId) return;
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      const payload: Record<string, unknown> = {};
      if (workspaceRoot) payload.workspace_root = workspaceRoot;
      const data = await httpPost<SpecValidationResult>(
        `/v1/spec/${encodeURIComponent(specId)}/validate`,
        payload,
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
