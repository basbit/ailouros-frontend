import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { useUiStore } from "@/shared/store/ui";

type UiStore = ReturnType<typeof useUiStore>;

const TERMINAL_STATUSES = new Set([
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "cancelled",
]);

export function useRunLiveSubscription(ui: UiStore): void {
  const router = useRouter();
  const route = useRoute();

  watch(
    () => [ui.taskStatus, ui.taskId] as const,
    ([status, taskId]) => {
      if (!taskId) return;
      if (route.path !== "/run/active") return;
      if (status && TERMINAL_STATUSES.has(status)) {
        void router.replace(`/run/done/${taskId}`);
      }
    },
  );
}
