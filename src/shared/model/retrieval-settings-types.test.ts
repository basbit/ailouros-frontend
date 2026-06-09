import { describe, expect, it } from "vitest";

import { parseRetrievalSettingsPayload } from "./retrieval-settings-types";

describe("parseRetrievalSettingsPayload", () => {
  it("returns null for a non-object payload", () => {
    expect(parseRetrievalSettingsPayload(null)).toBeNull();
    expect(parseRetrievalSettingsPayload("nope")).toBeNull();
  });

  it("parses late chunking settings", () => {
    const parsed = parseRetrievalSettingsPayload({
      late_chunking: {
        enabled: true,
        model_id: "sentence-transformers/all-MiniLM-L6-v2",
      },
    });
    expect(parsed?.lateChunkingEnabled).toBe(true);
    expect(parsed?.lateChunkingModelId).toContain("MiniLM");
  });

  it("defaults late chunking to disabled when the block is missing", () => {
    const parsed = parseRetrievalSettingsPayload({});
    expect(parsed?.lateChunkingEnabled).toBe(false);
    expect(parsed?.lateChunkingModelId).toBe("");
  });
});
