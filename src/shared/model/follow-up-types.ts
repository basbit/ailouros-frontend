export interface FollowUpSuggestion {
  text: string;
  rank: number;
}

interface RawSuggestion {
  text?: unknown;
  rank?: unknown;
}

export function parseFollowUpSuggestionPayload(
  raw: unknown,
): FollowUpSuggestion | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawSuggestion;
  const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
  if (!text) return null;
  const rank =
    typeof candidate.rank === "number" && Number.isFinite(candidate.rank)
      ? candidate.rank
      : 0;
  return { text, rank };
}
