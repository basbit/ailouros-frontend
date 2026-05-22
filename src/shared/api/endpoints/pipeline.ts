import { fetchJson } from "@/shared/api/client";

export interface PipelinePlanSnapshot {
  pipeline_steps?: string[];
  failed_step?: string;
  current_step?: string;
  partial_state?: Record<string, unknown>;
  workspace_writes?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  clarify_input_cache?: Record<string, unknown>;
  visual_probe_manifest?: Record<string, unknown>;
  visual_artifacts_dir?: string;
  visual_probe_status?: string;
}

export async function getTaskPipelinePlan(
  taskId: string,
): Promise<PipelinePlanSnapshot> {
  return fetchJson<PipelinePlanSnapshot>(
    `/artifacts/${encodeURIComponent(taskId)}/pipeline.json`,
  );
}
