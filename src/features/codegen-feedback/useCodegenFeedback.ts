import { ref, type Ref } from "vue";
import {
  submitCodegenFeedback,
  type CodegenFeedbackPayload,
} from "@/shared/api/endpoints/feedback";

export interface UseCodegenFeedbackState {
  loading: Ref<boolean>;
  lastSubmissionId: Ref<string | null>;
  error: Ref<string | null>;
  submit: (payload: CodegenFeedbackPayload) => Promise<string | null>;
}

export function useCodegenFeedback(): UseCodegenFeedbackState {
  const loading = ref(false);
  const lastSubmissionId = ref<string | null>(null);
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

  return { loading, lastSubmissionId, error, submit };
}
