import { describe, it, expect } from "vitest";

import { parseRetrievalDonePayload } from "./streaming-rag-types";

describe("parseRetrievalDonePayload", () => {
  it("parses the full backend payload (snake_case → camelCase)", () => {
    const result = parseRetrievalDonePayload({
      type: "retrieval_done",
      namespace: "wiki",
      query: "deployment topology",
      elapsed_ms: 1234,
      chunks: [
        {
          chunk_id: "wiki/architecture#topology",
          score: 0.82,
          rel_path: "wiki/architecture.md",
          section: "topology",
          snippet: "We use a hierarchical-mesh swarm…",
        },
      ],
    });
    expect(result).toEqual({
      namespace: "wiki",
      query: "deployment topology",
      elapsedMs: 1234,
      chunks: [
        {
          chunkId: "wiki/architecture#topology",
          score: 0.82,
          relPath: "wiki/architecture.md",
          section: "topology",
          snippet: "We use a hierarchical-mesh swarm…",
        },
      ],
    });
  });

  it("returns null for non-object input", () => {
    expect(parseRetrievalDonePayload(null)).toBeNull();
    expect(parseRetrievalDonePayload(undefined)).toBeNull();
    expect(parseRetrievalDonePayload("string")).toBeNull();
    expect(parseRetrievalDonePayload(42)).toBeNull();
  });

  it("drops malformed chunks (missing chunk_id) but keeps valid siblings", () => {
    const result = parseRetrievalDonePayload({
      namespace: "memory",
      query: "x",
      chunks: [
        { score: 0.9 }, // missing chunk_id → dropped
        { chunk_id: "memory/note#a", score: 0.7 },
      ],
    });
    expect(result?.chunks).toHaveLength(1);
    expect(result?.chunks[0]?.chunkId).toBe("memory/note#a");
  });

  it("defaults missing string fields to '' and numeric fields to 0", () => {
    const result = parseRetrievalDonePayload({
      chunks: [{ chunk_id: "x", score: "not a number", snippet: 42 }],
    });
    expect(result).toEqual({
      namespace: "",
      query: "",
      elapsedMs: 0,
      chunks: [
        {
          chunkId: "x",
          score: 0,
          relPath: "",
          section: "",
          snippet: "",
        },
      ],
    });
  });

  it("treats non-array chunks as empty", () => {
    const result = parseRetrievalDonePayload({
      namespace: "wiki",
      chunks: "not an array",
    });
    expect(result?.chunks).toEqual([]);
  });

  it("rejects whitespace-only chunk_id", () => {
    const result = parseRetrievalDonePayload({
      chunks: [{ chunk_id: "   ", score: 0.5 }],
    });
    expect(result?.chunks).toEqual([]);
  });
});
