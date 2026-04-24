import { fetchJson } from "@/shared/api/client";

export interface LegacyTaskHistoryRow {
  agent?: string;
  message?: string;
  timestamp?: string;
}

export interface LegacyTaskSnapshot {
  task_id?: string;
  status?: string;
  error?: unknown;
  history?: LegacyTaskHistoryRow[];
  agents?: string[];
}

export async function getLegacyTaskSnapshot(
  taskId: string,
): Promise<LegacyTaskSnapshot> {
  return fetchJson<LegacyTaskSnapshot>(`/tasks/${encodeURIComponent(taskId)}`);
}
