import { computed, readonly, ref } from "vue";

import {
  type FeedbackKind,
  type GoldenCandidate,
  type RetrievalFeedback,
} from "@/entities/retrieval-feedback";
import {
  promoteFeedbackToGolden,
  submitRetrievalFeedback,
} from "@/shared/api/endpoints/retrieval-feedback";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const records = ref<RetrievalFeedback[]>([]);
const submitting = ref(false);
const promoting = ref<string | null>(null);
const lastError = ref<string | null>(null);
const lastPromotion = ref<{
  feedbackId: string;
  candidate: GoldenCandidate;
  appendedTo: string | null;
} | null>(null);

const MAX_RECORDS = 32;

export function resetFeedbackThumbs(): void {
  records.value = [];
  submitting.value = false;
  promoting.value = null;
  lastError.value = null;
  lastPromotion.value = null;
}

export interface SubmitInput {
  workspaceRoot: string;
  kind: FeedbackKind;
  query: string;
  answer?: string;
  chunkIds?: string[];
  rationale?: string;
  scenario?: string;
}

export function useFeedbackThumbs() {
  async function submit(input: SubmitInput): Promise<RetrievalFeedback | null> {
    lastError.value = null;
    submitting.value = true;
    try {
      const record = await submitRetrievalFeedback(input);
      records.value = [record, ...records.value].slice(0, MAX_RECORDS);
      return record;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      frontendLogger.warn("feedback-thumbs: submit failed", { error: message });
      lastError.value = message;
      return null;
    } finally {
      submitting.value = false;
    }
  }

  async function promoteToGolden(
    feedbackId: string,
    workspaceRoot: string,
  ): Promise<boolean> {
    lastError.value = null;
    promoting.value = feedbackId;
    try {
      const result = await promoteFeedbackToGolden(feedbackId, workspaceRoot);
      lastPromotion.value = {
        feedbackId,
        candidate: result.candidate,
        appendedTo: result.appendedTo,
      };
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      frontendLogger.warn("feedback-thumbs: promote failed", {
        feedbackId,
        error: message,
      });
      lastError.value = message;
      return false;
    } finally {
      promoting.value = null;
    }
  }

  return {
    records: readonly(records),
    submit,
    promoteToGolden,
    submitting: readonly(submitting),
    promoting: readonly(promoting),
    lastError: readonly(lastError),
    lastPromotion: readonly(lastPromotion),
    visible: computed(() => records.value.length > 0),
  };
}
