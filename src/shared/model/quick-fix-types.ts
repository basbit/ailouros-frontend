type QuickFixVerdict = "accept" | "reject";

export interface QuickFixDecision {
  readonly verdict: QuickFixVerdict;
  readonly reason: string;
  readonly blockingFile: string;
  readonly blockingRule: string;
  readonly maxLoc: number;
}

interface RawDecision {
  verdict?: unknown;
  reason?: unknown;
  blocking_file?: unknown;
  blocking_rule?: unknown;
  max_loc?: unknown;
}

const KNOWN_VERDICTS: ReadonlySet<QuickFixVerdict> = new Set(["accept", "reject"]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readVerdict(value: unknown): QuickFixVerdict | null {
  const candidate = readString(value) as QuickFixVerdict;
  return KNOWN_VERDICTS.has(candidate) ? candidate : null;
}

function readNonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

export function parseQuickFixDecisionPayload(raw: unknown): QuickFixDecision | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawDecision;
  const verdict = readVerdict(candidate.verdict);
  if (!verdict) return null;
  return {
    verdict,
    reason: readString(candidate.reason),
    blockingFile: readString(candidate.blocking_file),
    blockingRule: readString(candidate.blocking_rule),
    maxLoc: readNonNegativeInt(candidate.max_loc),
  };
}
