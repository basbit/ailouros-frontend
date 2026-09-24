import { httpGet, httpPost } from "@/shared/api/http";

export interface TaskMetricRow {
  step_id: string;
  count: number;
  p50_ms: number;
  input_tokens: number;
  output_tokens: number;
  tool_calls_count: number;
}

export interface CancelTaskResult {
  task_id: string;
  status: string;
  /** False when the server had nothing running under this id. */
  was_active: boolean;
}

export async function cancelTask(taskId: string): Promise<CancelTaskResult> {
  const result = await httpPost<CancelTaskResult>(
    `/v1/tasks/${encodeURIComponent(taskId)}/cancel`,
  );
  return { ...result, was_active: result?.was_active === true };
}

export async function getTaskMetrics(taskId: string): Promise<TaskMetricRow[]> {
  const data = await httpGet<{ steps?: TaskMetricRow[] }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/metrics`,
  );
  return Array.isArray(data.steps) ? data.steps : [];
}
