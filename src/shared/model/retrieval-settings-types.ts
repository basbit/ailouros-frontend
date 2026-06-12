/**
 * Retrieval settings payload type.
 * The backend returns an empty object `{}` — reserved for future additions.
 * The type is kept for forward compatibility; the parser returns null on empty
 * payloads so the widget shows its empty/idle state.
 */
export interface RetrievalSettings {
  readonly _placeholder: true;
}

interface RawPayload {
  [key: string]: unknown;
}

export function parseRetrievalSettingsPayload(raw: unknown): RetrievalSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  // Return null when payload is empty (backend currently returns {})
  if (Object.keys(candidate).length === 0) return null;
  return { _placeholder: true };
}
