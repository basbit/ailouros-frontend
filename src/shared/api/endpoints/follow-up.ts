import {
  parseFollowUpSuggestionPayload,
  type FollowUpSuggestion,
} from "@/shared/model/follow-up-types";
import { httpGet, httpPost } from "@/shared/api/http";

interface StatusResponse {
  enabled?: unknown;
  count?: unknown;
}

interface GenerateResponse {
  suggestions?: unknown;
  count?: unknown;
}

export interface FollowUpStatus {
  enabled: boolean;
  count: number;
}

export async function getFollowUpStatus(): Promise<FollowUpStatus> {
  const raw = await httpGet<StatusResponse>("/v1/follow-up-suggestions/status");
  return {
    enabled: Boolean(raw.enabled),
    count: typeof raw.count === "number" ? raw.count : 0,
  };
}

export interface GenerateFollowUpsInput {
  query: string;
  answer?: string;
  contexts?: string[];
}

export async function generateFollowUps(
  input: GenerateFollowUpsInput,
): Promise<FollowUpSuggestion[]> {
  const raw = await httpPost<GenerateResponse>("/v1/follow-up-suggestions", {
    query: input.query,
    answer: input.answer ?? "",
    contexts: input.contexts ?? [],
  });
  if (!Array.isArray(raw.suggestions)) return [];
  return raw.suggestions
    .map(parseFollowUpSuggestionPayload)
    .filter((entry): entry is FollowUpSuggestion => entry !== null)
    .sort((a, b) => a.rank - b.rank);
}
