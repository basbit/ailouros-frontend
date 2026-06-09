import { describe, expect, it } from "vitest";

import {
  extractChunkIds,
  iterMarkerSpans,
  splitTextByCitations,
} from "./citation-marker";

describe("extractChunkIds", () => {
  it("returns unique chunk_ids in document order", () => {
    const text =
      "See [chunk_id:wiki/auth#login], then [chunk_id:wiki/auth#logout]," +
      " and again [chunk_id:wiki/auth#login].";
    expect(extractChunkIds(text)).toEqual(["wiki/auth#login", "wiki/auth#logout"]);
  });

  it("returns an empty array for text without markers", () => {
    expect(extractChunkIds("plain prose")).toEqual([]);
  });

  it("returns an empty array for null / empty input", () => {
    expect(extractChunkIds("")).toEqual([]);
  });

  it("accepts chunk_id paths containing dots, slashes, hashes, and colons", () => {
    const text =
      "[chunk_id:wiki/architecture.md#topology] and [chunk_id:memory/notes#a:b]";
    expect(extractChunkIds(text)).toEqual([
      "wiki/architecture.md#topology",
      "memory/notes#a:b",
    ]);
  });
});

describe("iterMarkerSpans", () => {
  it("reports the exact slice positions of each marker", () => {
    const text = "first [chunk_id:a#b] middle [chunk_id:c#d] last";
    const spans = iterMarkerSpans(text);
    expect(spans).toHaveLength(2);
    expect(text.slice(spans[0].start, spans[0].end)).toBe("[chunk_id:a#b]");
    expect(spans[1].chunkId).toBe("c#d");
  });
});

describe("splitTextByCitations", () => {
  it("produces alternating text + marker segments", () => {
    const segments = splitTextByCitations("hi [chunk_id:a#b] there");
    expect(segments).toEqual([
      { kind: "text", text: "hi " },
      { kind: "marker", text: "[chunk_id:a#b]", chunkId: "a#b" },
      { kind: "text", text: " there" },
    ]);
  });

  it("returns a single text segment when no markers are present", () => {
    expect(splitTextByCitations("just text")).toEqual([
      { kind: "text", text: "just text" },
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(splitTextByCitations("")).toEqual([]);
  });

  it("handles back-to-back markers without dropping characters", () => {
    const segments = splitTextByCitations("[chunk_id:a#b][chunk_id:c#d]");
    expect(segments).toEqual([
      { kind: "marker", text: "[chunk_id:a#b]", chunkId: "a#b" },
      { kind: "marker", text: "[chunk_id:c#d]", chunkId: "c#d" },
    ]);
  });

  it("preserves trailing prose after the last marker", () => {
    const segments = splitTextByCitations("[chunk_id:a#b] tail");
    expect(segments).toEqual([
      { kind: "marker", text: "[chunk_id:a#b]", chunkId: "a#b" },
      { kind: "text", text: " tail" },
    ]);
  });
});
