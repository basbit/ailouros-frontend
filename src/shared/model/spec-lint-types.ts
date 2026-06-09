type LintSeverity = "info" | "warning" | "error";

interface LintFinding {
  readonly ruleId: string;
  readonly severity: LintSeverity;
  readonly message: string;
  readonly spanStart: number;
  readonly spanEnd: number;
}

export interface SpecLintReport {
  readonly scenario: string;
  readonly findings: readonly LintFinding[];
  readonly counts: Readonly<Record<string, number>>;
  readonly blockingCount: number;
  readonly hasErrors: boolean;
}

interface RawFinding {
  rule_id?: unknown;
  severity?: unknown;
  message?: unknown;
  span_start?: unknown;
  span_end?: unknown;
}

interface RawReport {
  scenario?: unknown;
  findings?: unknown;
  counts?: unknown;
  blocking_count?: unknown;
  has_errors?: unknown;
}

const KNOWN_SEVERITIES: Set<LintSeverity> = new Set(["info", "warning", "error"]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : -1;
}

function readSeverity(value: unknown): LintSeverity {
  const candidate = readString(value) as LintSeverity;
  return KNOWN_SEVERITIES.has(candidate) ? candidate : "info";
}

function parseFinding(raw: unknown): LintFinding | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawFinding;
  const ruleId = readString(candidate.rule_id).trim();
  if (!ruleId) return null;
  return {
    ruleId,
    severity: readSeverity(candidate.severity),
    message: readString(candidate.message),
    spanStart: readInteger(candidate.span_start),
    spanEnd: readInteger(candidate.span_end),
  };
}

function parseCounts(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object") return {};
  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      counts[key] = Math.trunc(value);
    }
  }
  return counts;
}

export function parseSpecLintReportPayload(raw: unknown): SpecLintReport | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawReport;
  const scenario = readString(candidate.scenario);
  if (!scenario) return null;
  const findings = Array.isArray(candidate.findings)
    ? candidate.findings
        .map(parseFinding)
        .filter((entry): entry is LintFinding => entry !== null)
    : [];
  const blockingCount =
    typeof candidate.blocking_count === "number" &&
    Number.isFinite(candidate.blocking_count)
      ? Math.trunc(candidate.blocking_count)
      : 0;
  return {
    scenario,
    findings,
    counts: parseCounts(candidate.counts),
    blockingCount,
    hasErrors: Boolean(candidate.has_errors),
  };
}
