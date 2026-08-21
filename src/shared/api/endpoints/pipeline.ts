import { httpGet } from "@/shared/api/http";

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
  e2e_artifacts_dir?: string;
  e2e_screenshot_urls?: string[];
}

export async function getTaskPipelinePlan(
  taskId: string,
): Promise<PipelinePlanSnapshot> {
  return httpGet<PipelinePlanSnapshot>(
    `/artifacts/${encodeURIComponent(taskId)}/pipeline.json`,
  );
}
