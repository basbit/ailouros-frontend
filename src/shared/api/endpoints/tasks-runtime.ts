import { fetchJson } from "@/shared/api/client";

export interface TaskMetricRow {
  step_id: string;
  count: number;
  p50_ms: number;
  input_tokens: number;
  output_tokens: number;
  tool_calls_count: number;
}

export async function cancelTask(taskId: string): Promise<void> {
  await fetchJson<{ task_id: string; status: string; was_active: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/cancel`,
    { method: "POST" },
  );
}

export async function getTaskMetrics(taskId: string): Promise<TaskMetricRow[]> {
  const data = await fetchJson<{ steps?: TaskMetricRow[] }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/metrics`,
  );
  return Array.isArray(data.steps) ? data.steps : [];
}
