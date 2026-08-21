import { ref, type Ref } from "vue";
import {
  listCodegenFeedback,
  submitCodegenFeedback,
  type CodegenFeedbackItem,
  type CodegenFeedbackPayload,
} from "@/shared/api/endpoints/feedback";

export interface UseCodegenFeedbackState {
  loading: Ref<boolean>;
  listing: Ref<boolean>;
  lastSubmissionId: Ref<string | null>;
  previous: Ref<CodegenFeedbackItem[]>;
  error: Ref<string | null>;
  submit: (payload: CodegenFeedbackPayload) => Promise<string | null>;
  list: (
    specId: string,
    targetFile: string,
    k?: number,
  ) => Promise<CodegenFeedbackItem[]>;
}

export function useCodegenFeedback(): UseCodegenFeedbackState {
  const loading = ref(false);
  const listing = ref(false);
  const lastSubmissionId = ref<string | null>(null);
  const previous = ref<CodegenFeedbackItem[]>([]);
  const error = ref<string | null>(null);

  async function submit(payload: CodegenFeedbackPayload): Promise<string | null> {
    loading.value = true;
    error.value = null;
    try {
      const result = await submitCodegenFeedback(payload);
      lastSubmissionId.value = result.id;
      return result.id;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function list(
    specId: string,
    targetFile: string,
    k = 10,
  ): Promise<CodegenFeedbackItem[]> {
    listing.value = true;
    error.value = null;
    try {
      const result = await listCodegenFeedback(specId, targetFile, k);
      previous.value = result.items;
      return result.items;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err);
      return [];
    } finally {
      listing.value = false;
    }
  }

  return { loading, listing, lastSubmissionId, previous, error, submit, list };
}
