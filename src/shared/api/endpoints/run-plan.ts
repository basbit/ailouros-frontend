import { parseRunPlanPayload, type RunPlan } from "@/shared/model/run-plan-types";
import { ApiError, httpGet } from "@/shared/api/http";

export async function getRunPlan(taskId: string): Promise<RunPlan> {
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/run-plan/${encodeURIComponent(taskId)}`,
  );
  const parsed = parseRunPlanPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "run-plan returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
