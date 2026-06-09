import { httpGet, httpPost } from "@/shared/api/http";

export interface TaskMetricRow {
  step_id: string;
  count: number;
  p50_ms: number;
  input_tokens: number;
  output_tokens: number;
  tool_calls_count: number;
}

export async function cancelTask(taskId: string): Promise<void> {
  await httpPost<{ task_id: string; status: string; was_active: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/cancel`,
  );
}

export async function getTaskMetrics(taskId: string): Promise<TaskMetricRow[]> {
  const data = await httpGet<{ steps?: TaskMetricRow[] }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/metrics`,
  );
  return Array.isArray(data.steps) ? data.steps : [];
}
