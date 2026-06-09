const CITATION_MARKER_SOURCE = "\\[chunk_id:([A-Za-z0-9_\\-./#:]+?)\\]";

function citationMarkerRegex(): RegExp {
  return new RegExp(CITATION_MARKER_SOURCE, "g");
}

export interface CitationMarkerSpan {
  readonly chunkId: string;
  readonly start: number;
  readonly end: number;
  readonly raw: string;
}

export interface CitationRenderSegment {
  readonly kind: "text" | "marker";
  readonly text: string;
  readonly chunkId?: string;
}

export function extractChunkIds(text: string): string[] {
  if (!text) return [];
  const seen: string[] = [];
  const regex = citationMarkerRegex();
  for (const match of text.matchAll(regex)) {
    const chunkId = match[1];
    if (chunkId && !seen.includes(chunkId)) seen.push(chunkId);
  }
  return seen;
}

export function iterMarkerSpans(text: string): CitationMarkerSpan[] {
  if (!text) return [];
  const spans: CitationMarkerSpan[] = [];
  const regex = citationMarkerRegex();
  for (const match of text.matchAll(regex)) {
    if (match.index === undefined || !match[1]) continue;
    spans.push({
      chunkId: match[1],
      start: match.index,
      end: match.index + match[0].length,
      raw: match[0],
    });
  }
  return spans;
}

export function splitTextByCitations(text: string): CitationRenderSegment[] {
  if (!text) return [];
  const spans = iterMarkerSpans(text);
  if (spans.length === 0) {
    return [{ kind: "text", text }];
  }
  const segments: CitationRenderSegment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start > cursor) {
      segments.push({ kind: "text", text: text.slice(cursor, span.start) });
    }
    segments.push({ kind: "marker", text: span.raw, chunkId: span.chunkId });
    cursor = span.end;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", text: text.slice(cursor) });
  }
  return segments;
}
