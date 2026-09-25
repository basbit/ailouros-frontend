import { httpPost } from "@/shared/api/http";
import type { components } from "@/shared/api/openapi-types";

export type CodegenFeedbackVerdict = "accept" | "reject" | "edit";

type FeedbackBody = components["schemas"]["FeedbackBody"];

export interface CodegenFeedbackInput {
  specId: string;
  agent: string;
  targetFile: string;
  verdict: CodegenFeedbackVerdict;
  reason?: string;
  userEditDiff?: string;
  workspaceRoot: string;
  memoryNamespace?: string;
}

export interface CodegenFeedbackReceipt {
  id: string;
  recorded_at: string;
}

export function taskFeedbackSpecId(taskId: string): string {
  return `_task:${taskId}`;
}

export async function submitCodegenFeedback(
  input: CodegenFeedbackInput,
): Promise<CodegenFeedbackReceipt> {
  const body: FeedbackBody = {
    spec_id: input.specId,
    agent: input.agent,
    target_file: input.targetFile,
    verdict: input.verdict,
    reason: input.reason?.trim() ? input.reason.trim() : null,
    user_edit_diff: input.userEditDiff ? input.userEditDiff : null,
    tags: [],
    workspace_root: input.workspaceRoot,
    memory_namespace: input.memoryNamespace ?? null,
  };
  return httpPost<CodegenFeedbackReceipt>("/v1/codegen-feedback", body);
}
