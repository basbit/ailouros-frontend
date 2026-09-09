import { httpPost } from "@/shared/api/http";
import type { ForkStepRequest, ForkStepResponse } from "../model/types";

export async function forkTaskStep(
  taskId: string,
  payload: ForkStepRequest,
): Promise<ForkStepResponse> {
  return httpPost<ForkStepResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/fork-step`,
    payload,
  );
}
