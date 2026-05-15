import { httpGet, httpPost } from "@/shared/api/http";

export type FeedbackVerdict = "accept" | "reject" | "edit";

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

export interface CodegenFeedbackItem {
  id: string;
  spec_id: string;
  agent: string;
  target_file: string;
  verdict: FeedbackVerdict;
  user_edit_diff: string | null;
  reason: string | null;
  recorded_at: string;
  tags: string[];
}

export interface CodegenFeedbackListResult {
  items: CodegenFeedbackItem[];
  count: number;
}

export async function submitCodegenFeedback(
  payload: CodegenFeedbackPayload,
): Promise<CodegenFeedbackSubmitResult> {
  return httpPost<CodegenFeedbackSubmitResult>("/v1/codegen-feedback", payload);
}

export async function listCodegenFeedback(
  specId: string,
  targetFile: string,
  k = 10,
): Promise<CodegenFeedbackListResult> {
  const params = new URLSearchParams({
    spec_id: specId,
    target_file: targetFile,
    k: String(k),
  });
  return httpGet<CodegenFeedbackListResult>(
    `/v1/codegen-feedback?${params.toString()}`,
  );
}
