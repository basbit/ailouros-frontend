export interface RetrievalSettings {
  readonly lateChunkingEnabled: boolean;
  readonly lateChunkingModelId: string;
}

interface RawLateChunking {
  enabled?: unknown;
  model_id?: unknown;
}

interface RawPayload {
  late_chunking?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseRetrievalSettingsPayload(raw: unknown): RetrievalSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  const lateChunking = (candidate.late_chunking ?? {}) as RawLateChunking;
  return {
    lateChunkingEnabled: Boolean(lateChunking.enabled),
    lateChunkingModelId: readString(lateChunking.model_id),
  };
}
