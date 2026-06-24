import { describe, expect, it } from "vitest";

import { parseRetrievalSettingsPayload } from "./retrieval-settings-types";

describe("parseRetrievalSettingsPayload", () => {
  it("returns null for a non-object payload", () => {
    expect(parseRetrievalSettingsPayload(null)).toBeNull();
    expect(parseRetrievalSettingsPayload("nope")).toBeNull();
  });

  it("returns null when the status payload is empty/unknown (idle state)", () => {
    expect(parseRetrievalSettingsPayload({})).toBeNull();
    expect(parseRetrievalSettingsPayload({ other: 1 })).toBeNull();
  });

  it("maps the live retrieval status payload to camelCase fields", () => {
    const parsed = parseRetrievalSettingsPayload({
      wiki_search_enabled: true,
      top_k: 5,
      max_chars: 8000,
      min_relevance: 0.5,
      rerank_model: "bge-reranker",
    });
    expect(parsed).toEqual({
      wikiSearchEnabled: true,
      topK: 5,
      maxChars: 8000,
      minRelevance: 0.5,
      rerankModel: "bge-reranker",
    });
  });

  it("coerces missing/wrong-typed fields to safe defaults", () => {
    const parsed = parseRetrievalSettingsPayload({ wiki_search_enabled: false });
    expect(parsed).toEqual({
      wikiSearchEnabled: false,
      topK: 0,
      maxChars: 0,
      minRelevance: 0,
      rerankModel: "",
    });
  });
});
