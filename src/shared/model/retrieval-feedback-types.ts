export type FeedbackKind = "thumbs_up" | "thumbs_down" | "mark_as_golden";

export interface RetrievalFeedback {
  feedbackId: string;
  kind: FeedbackKind;
  query: string;
  answer: string;
  chunkIds: string[];
  rationale: string;
  scenario: string;
  createdAt: number;
}

export interface GoldenCandidate {
  query: string;
  expectedChunkIds: string[];
  requiredSubstrings: string[];
  scenario: string;
}

interface RawFeedback {
  feedback_id?: unknown;
  kind?: unknown;
  query?: unknown;
  answer?: unknown;
  chunk_ids?: unknown;
  rationale?: unknown;
  scenario?: unknown;
  created_at?: unknown;
}

interface RawGolden {
  query?: unknown;
  expected_chunk_ids?: unknown;
  required_substrings?: unknown;
  scenario?: unknown;
}

const KNOWN_KINDS: Set<FeedbackKind> = new Set([
  "thumbs_up",
  "thumbs_down",
  "mark_as_golden",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function parseFeedbackPayload(raw: unknown): RetrievalFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawFeedback;
  const feedbackId = readString(candidate.feedback_id).trim();
  const kind = readString(candidate.kind) as FeedbackKind;
  if (!feedbackId || !KNOWN_KINDS.has(kind)) return null;
  const createdAtRaw = candidate.created_at;
  return {
    feedbackId,
    kind,
    query: readString(candidate.query),
    answer: readString(candidate.answer),
    chunkIds: readStringArray(candidate.chunk_ids),
    rationale: readString(candidate.rationale),
    scenario: readString(candidate.scenario),
    createdAt:
      typeof createdAtRaw === "number" && Number.isFinite(createdAtRaw)
        ? createdAtRaw
        : 0,
  };
}

export function parseGoldenCandidatePayload(raw: unknown): GoldenCandidate | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawGolden;
  return {
    query: readString(candidate.query),
    expectedChunkIds: readStringArray(candidate.expected_chunk_ids),
    requiredSubstrings: readStringArray(candidate.required_substrings),
    scenario: readString(candidate.scenario),
  };
}
