import { watch } from "vue";
import type { Ref } from "vue";

interface TurnRunLinkOptions {
  /** Task id of the run the page is currently driving. */
  taskId: () => string | null;
  /** Turn that started that run, or null when no run is in flight. */
  activeTurnId: Ref<string | null>;
  /** Task id already stored on that turn, used to avoid redundant patches. */
  linkedTaskId: (turnId: string) => string | null;
  patchTurn: (
    turnId: string,
    updates: { task_id: string; status: "running" },
  ) => void;
}

/**
 * Links a chat turn to its pipeline run as soon as the run reports a task id.
 * Waiting for the run to finish would leave the turn unlinked for its whole
 * lifetime — and forever when the run fails — so the progress bar could never
 * open the pipeline it belongs to.
 */
export function useTurnRunLink(options: TurnRunLinkOptions): void {
  watch(
    () => [options.taskId(), options.activeTurnId.value] as const,
    ([taskId, turnId]) => {
      if (!taskId || !turnId) return;
      if (options.linkedTaskId(turnId) === taskId) return;
      options.patchTurn(turnId, { task_id: taskId, status: "running" });
    },
    { immediate: true },
  );
}
