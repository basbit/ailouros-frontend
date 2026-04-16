import { fetchJson } from "@/shared/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Pipeline plan snapshot stored at
 * /artifacts/{taskId}/pipeline.json after a run completes.
 * Consumed by the pipeline editor to rehydrate saved runs.
 */
export interface PipelinePlanSnapshot {
  pipeline_steps?: string[];
  failed_step?: string;
  partial_state?: Record<string, unknown>;
  workspace_writes?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  clarify_input_cache?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

/**
 * Fetch the pipeline.json artifact snapshot for a completed or failed task.
 *
 * GET /artifacts/{taskId}/pipeline.json
 */
export async function getTaskPipelinePlan(
  taskId: string,
): Promise<PipelinePlanSnapshot> {
  return fetchJson<PipelinePlanSnapshot>(
    `/artifacts/${encodeURIComponent(taskId)}/pipeline.json`,
  );
}
