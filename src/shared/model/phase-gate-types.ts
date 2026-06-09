export type PhaseGateDecision =
  | "pending"
  | "approved"
  | "changes_requested"
  | "timed_out";

export interface PhaseGate {
  readonly gateId: string;
  readonly scenario: string;
  readonly phaseId: string;
  readonly taskId: string;
  readonly summary: string;
  readonly acceptanceCriteria: readonly string[];
  readonly decision: PhaseGateDecision;
  readonly decidedBy: string;
  readonly decidedAt: number;
  readonly rationale: string;
  readonly createdAt: number;
  readonly ttlSeconds: number;
}

interface RawPhaseGate {
  gate_id?: unknown;
  scenario?: unknown;
  phase_id?: unknown;
  task_id?: unknown;
  summary?: unknown;
  acceptance_criteria?: unknown;
  decision?: unknown;
  decided_by?: unknown;
  decided_at?: unknown;
  rationale?: unknown;
  created_at?: unknown;
  ttl_seconds?: unknown;
}

const KNOWN_DECISIONS: Set<PhaseGateDecision> = new Set([
  "pending",
  "approved",
  "changes_requested",
  "timed_out",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function parsePhaseGatePayload(raw: unknown): PhaseGate | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPhaseGate;
  const gateId = readString(candidate.gate_id).trim();
  if (!gateId) return null;
  const decision = readString(candidate.decision) as PhaseGateDecision;
  if (!KNOWN_DECISIONS.has(decision)) return null;
  return {
    gateId,
    scenario: readString(candidate.scenario),
    phaseId: readString(candidate.phase_id),
    taskId: readString(candidate.task_id),
    summary: readString(candidate.summary),
    acceptanceCriteria: readStringArray(candidate.acceptance_criteria),
    decision,
    decidedBy: readString(candidate.decided_by),
    decidedAt: readNumber(candidate.decided_at),
    rationale: readString(candidate.rationale),
    createdAt: readNumber(candidate.created_at),
    ttlSeconds: Math.trunc(readNumber(candidate.ttl_seconds)),
  };
}
