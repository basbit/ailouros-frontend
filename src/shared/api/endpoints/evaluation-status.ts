import {
  parseEvaluationStatusPayload,
  type EvaluationStatus,
} from "@/shared/model/evaluation-status-types";
import { ApiError, httpGet } from "@/shared/api/http";

export async function getEvaluationStatus(): Promise<EvaluationStatus> {
  const raw = await httpGet<Record<string, unknown>>("/v1/evaluation/status");
  const parsed = parseEvaluationStatusPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "evaluation status returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
