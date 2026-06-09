import {
  parseQuickFixDecisionPayload,
  type QuickFixDecision,
} from "@/shared/model/quick-fix-types";
import { ApiError, httpPost } from "@/shared/api/http";

export interface EvaluateQuickFixInput {
  description: string;
  targetFiles: readonly string[];
  estimatedLoc: number;
}

export async function evaluateQuickFix(
  input: EvaluateQuickFixInput,
): Promise<QuickFixDecision> {
  const body = {
    description: input.description,
    target_files: [...input.targetFiles],
    estimated_loc: input.estimatedLoc,
  };
  const raw = await httpPost<Record<string, unknown>>(
    "/v1/orchestration/quick-fix-evaluate",
    body,
  );
  const parsed = parseQuickFixDecisionPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "quick-fix returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
