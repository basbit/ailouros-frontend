import { httpGet } from "@/shared/api/http";

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
  scenario_id?: string | null;
  scenario_title?: string | null;
  scenario_category?: string | null;
  /** Steps the run actually executed (artifact-sourced). */
  pipeline_steps?: string[];
  /** Step the run failed at (artifact-sourced). */
  failed_step?: string;
  resume_from_step?: string;
  /** The step waiting on a human, on a paused run. */
  human_approval_step?: string;
  /** True when the task store forgot the task and it was rebuilt from artifacts. */
  recovered_from_artifacts?: boolean;
}

export async function getLegacyTaskSnapshot(
  taskId: string,
): Promise<LegacyTaskSnapshot> {
  return httpGet<LegacyTaskSnapshot>(`/v1/tasks/${encodeURIComponent(taskId)}`);
}
