import { ref, watch, type Ref } from "vue";
import type { PeerReviewReport } from "@/entities/review/model/types";
import { getTaskPeerReview } from "@/entities/review/api/peer-review-api";

export function usePeerReview(taskId: Ref<string | null> | (() => string | null)) {
  const report = ref<PeerReviewReport | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function refresh(): Promise<void> {
    const currentId = typeof taskId === "function" ? taskId() : taskId.value;
    if (!currentId) {
      report.value = null;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const response = await getTaskPeerReview(currentId);
      report.value = response.report;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      error.value = message;
    } finally {
      loading.value = false;
    }
  }

  watch(
    () => (typeof taskId === "function" ? taskId() : taskId.value),
    (newId) => {
      if (newId) {
        void refresh();
      } else {
        report.value = null;
      }
    },
    { immediate: true },
  );

  return {
    report,
    loading,
    error,
    refresh,
  };
}
