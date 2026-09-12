import type { HistoryEntry } from "@/shared/store/ui-history";

/**
 * Route to a run's pipeline page in History.
 *
 * A run is reachable by two different ids: the history entry id and the task
 * id, and which one exists depends on whether the run has been persisted to
 * history yet. `HistoryDetailPage` accepts either — it matches on `item.id` or
 * `item.taskId` and otherwise fetches a snapshot by the raw id — so preferring
 * the entry id and falling back to the task id always lands on the pipeline
 * rather than a dead route.
 */
export function runDetailRoute(
  historyList: readonly Pick<HistoryEntry, "id" | "taskId">[],
  taskId: string,
): string {
  const trimmed = taskId.trim();
  const entry = historyList.find(
    (item) => (item.taskId ?? "").trim() === trimmed || item.id === trimmed,
  );
  return `/history/${encodeURIComponent(entry?.id ?? trimmed)}`;
}
