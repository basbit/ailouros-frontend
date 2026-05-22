import { httpPost } from "@/shared/api/http";

type FeedbackVerdict = "accept" | "reject" | "edit";

export interface CodegenFeedbackPayload {
  spec_id: string;
  agent: string;
  target_file: string;
  verdict: FeedbackVerdict;
  user_edit_diff?: string;
  reason?: string;
  tags?: string[];
}

export interface CodegenFeedbackSubmitResult {
  id: string;
  recorded_at: string;
}

export async function submitCodegenFeedback(
  payload: CodegenFeedbackPayload,
): Promise<CodegenFeedbackSubmitResult> {
  return httpPost<CodegenFeedbackSubmitResult>("/v1/codegen-feedback", payload);
}
