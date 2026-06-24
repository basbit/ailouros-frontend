/**
 * Retrieval settings payload.
 * The backend (`GET /v1/retrieval/settings`) returns the effective, read-only
 * retrieval configuration. The parser returns null for an empty/unknown payload
 * so the widget can show its idle state.
 */
export interface RetrievalSettings {
  readonly wikiSearchEnabled: boolean;
  readonly topK: number;
  readonly maxChars: number;
  readonly minRelevance: number;
  readonly rerankModel: string;
}

interface RawPayload {
  [key: string]: unknown;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseRetrievalSettingsPayload(raw: unknown): RetrievalSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  if (!("wiki_search_enabled" in candidate)) return null;
  return {
    wikiSearchEnabled: Boolean(candidate.wiki_search_enabled),
    topK: asNumber(candidate.top_k),
    maxChars: asNumber(candidate.max_chars),
    minRelevance: asNumber(candidate.min_relevance),
    rerankModel:
      typeof candidate.rerank_model === "string" ? candidate.rerank_model : "",
  };
}
