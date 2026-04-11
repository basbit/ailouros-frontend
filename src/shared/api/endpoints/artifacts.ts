import { fetchJson } from "@/shared/api/client";

export interface PipelineJsonSnapshot {
  failed_step?: string;
  pipeline_steps?: string[];
}

export async function getArtifactPipelineJson(
  taskId: string,
): Promise<PipelineJsonSnapshot> {
  return fetchJson<PipelineJsonSnapshot>(
    `/artifacts/${encodeURIComponent(taskId)}/pipeline.json`,
  );
}
