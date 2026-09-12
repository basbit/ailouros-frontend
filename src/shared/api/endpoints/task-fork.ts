import { httpPost, httpPostStream } from "@/shared/api/http";
import type { components, paths } from "@/shared/api/openapi-types";

export type ForkStepRequest = components["schemas"]["ForkStepRequest"];
export type ForkRunRequest = components["schemas"]["ForkRunRequest"];

export type ForkStepResponse =
  paths["/v1/tasks/{task_id}/fork-step"]["post"]["responses"][200]["content"]["application/json"];

export interface ForkRunInput {
  instruction?: string | null;
  pipelineSteps?: string[] | null;
  agentConfig?: Record<string, unknown> | null;
}

export async function forkTaskStep(
  taskId: string,
  payload: ForkStepRequest,
): Promise<ForkStepResponse> {
  return httpPost<ForkStepResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/fork-step`,
    payload,
  );
}

export async function postForkRunStream(
  forkedTaskId: string,
  input: ForkRunInput = {},
): Promise<Response> {
  const body: ForkRunRequest = {
    model: "swarm",
    stream: true,
    instruction: input.instruction ?? null,
    pipeline_steps: input.pipelineSteps ?? null,
    agent_config: input.agentConfig ?? null,
  };
  return httpPostStream(
    `/v1/tasks/${encodeURIComponent(forkedTaskId)}/fork-run`,
    body,
  );
}
