import {
  parseFeedbackPayload,
  parseGoldenCandidatePayload,
  type FeedbackKind,
  type GoldenCandidate,
  type RetrievalFeedback,
} from "@/shared/model/retrieval-feedback-types";
import { ApiError, httpPost } from "@/shared/api/http";

export interface SubmitFeedbackInput {
  workspaceRoot: string;
  kind: FeedbackKind;
  query: string;
  answer?: string;
  chunkIds?: string[];
  rationale?: string;
  scenario?: string;
}

export async function submitRetrievalFeedback(
  input: SubmitFeedbackInput,
): Promise<RetrievalFeedback> {
  const body = {
    workspace_root: input.workspaceRoot,
    kind: input.kind,
    query: input.query,
    answer: input.answer ?? "",
    chunk_ids: input.chunkIds ?? [],
    rationale: input.rationale ?? "",
    scenario: input.scenario ?? "",
  };
  const raw = await httpPost<Record<string, unknown>>("/v1/feedback/retrieval", body);
  const parsed = parseFeedbackPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "submitRetrievalFeedback received a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}

export interface PromoteResult {
  candidate: GoldenCandidate;
  appendedTo: string | null;
}

export async function promoteFeedbackToGolden(
  feedbackId: string,
  workspaceRoot: string,
): Promise<PromoteResult> {
  const raw = await httpPost<{
    candidate?: unknown;
    appended_to?: unknown;
  }>(`/v1/feedback/retrieval/${encodeURIComponent(feedbackId)}/promote`, {
    workspace_root: workspaceRoot,
  });
  const candidate = parseGoldenCandidatePayload(raw.candidate);
  if (!candidate) {
    throw new ApiError(
      "promoteFeedbackToGolden received a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return {
    candidate,
    appendedTo: typeof raw.appended_to === "string" ? raw.appended_to : null,
  };
}
