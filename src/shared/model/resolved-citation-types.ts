export interface ResolvedCitation {
  chunkId: string;
  relPath: string;
  section: string;
  anchor: string;
  snippet: string;
  found: boolean;
}

interface RawResolvedCitation {
  chunk_id?: unknown;
  rel_path?: unknown;
  section?: unknown;
  anchor?: unknown;
  snippet?: unknown;
  found?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseResolvedCitationPayload(raw: unknown): ResolvedCitation | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawResolvedCitation;
  const chunkId = readString(candidate.chunk_id).trim();
  if (!chunkId) return null;
  return {
    chunkId,
    relPath: readString(candidate.rel_path),
    section: readString(candidate.section),
    anchor: readString(candidate.anchor),
    snippet: readString(candidate.snippet),
    found: Boolean(candidate.found),
  };
}
