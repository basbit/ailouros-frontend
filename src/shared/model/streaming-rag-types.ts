interface RetrievalChunkPreview {
  chunkId: string;
  score: number;
  relPath: string;
  section: string;
  snippet: string;
}

export interface RetrievalDoneEvent {
  namespace: string;
  query: string;
  elapsedMs: number;
  chunks: RetrievalChunkPreview[];
}

interface RawChunkPayload {
  chunk_id?: unknown;
  score?: unknown;
  rel_path?: unknown;
  section?: unknown;
  snippet?: unknown;
}

interface RawRetrievalDonePayload {
  namespace?: unknown;
  query?: unknown;
  elapsed_ms?: unknown;
  chunks?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseChunk(raw: unknown): RetrievalChunkPreview | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawChunkPayload;
  const chunkId = readString(candidate.chunk_id).trim();
  if (!chunkId) return null;
  return {
    chunkId,
    score: readNumber(candidate.score),
    relPath: readString(candidate.rel_path),
    section: readString(candidate.section),
    snippet: readString(candidate.snippet),
  };
}

export function parseRetrievalDonePayload(raw: unknown): RetrievalDoneEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawRetrievalDonePayload;
  return {
    namespace: readString(candidate.namespace),
    query: readString(candidate.query),
    elapsedMs: readNumber(candidate.elapsed_ms),
    chunks: Array.isArray(candidate.chunks)
      ? candidate.chunks
          .map(parseChunk)
          .filter((chunk): chunk is RetrievalChunkPreview => chunk !== null)
      : [],
  };
}
