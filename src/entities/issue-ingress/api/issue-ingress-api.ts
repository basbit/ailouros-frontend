import { httpPost } from "@/shared/api/http";
import type {
  CreatePullRequestRequest,
  CreatePullRequestResponse,
  ImportIssueRequest,
  ImportIssueResponse,
} from "../model/types";

export async function importIssue(url: string): Promise<ImportIssueResponse> {
  const payload: ImportIssueRequest = { url };
  return httpPost<ImportIssueResponse>("/v1/integrations/issues/import", payload);
}

export async function createPullRequest(
  payload: CreatePullRequestRequest,
): Promise<CreatePullRequestResponse> {
  return httpPost<CreatePullRequestResponse>(
    "/v1/integrations/issues/pull-request",
    payload,
  );
}
