interface RagasStatus {
  readonly enabled: boolean;
  readonly judgeKind: string;
}

interface TelemetryStatus {
  readonly enabled: boolean;
  readonly exporterKind: string;
}

interface EntailmentStatus {
  readonly enabled: boolean;
  readonly judgeKind: string;
  readonly threshold: number;
}

export interface EvaluationStatus {
  readonly ragas: RagasStatus;
  readonly telemetry: TelemetryStatus;
  readonly entailment: EntailmentStatus;
}

interface RawRagas {
  enabled?: unknown;
  judge_kind?: unknown;
}

interface RawTelemetry {
  enabled?: unknown;
  exporter_kind?: unknown;
}

interface RawEntailment {
  enabled?: unknown;
  judge_kind?: unknown;
  threshold?: unknown;
}

interface RawPayload {
  ragas?: unknown;
  telemetry?: unknown;
  entailment?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseRagas(raw: unknown): RagasStatus {
  const candidate = (raw ?? {}) as RawRagas;
  return {
    enabled: Boolean(candidate.enabled),
    judgeKind: readString(candidate.judge_kind) || "heuristic",
  };
}

function parseTelemetry(raw: unknown): TelemetryStatus {
  const candidate = (raw ?? {}) as RawTelemetry;
  return {
    enabled: Boolean(candidate.enabled),
    exporterKind: readString(candidate.exporter_kind) || "noop",
  };
}

function parseEntailment(raw: unknown): EntailmentStatus {
  const candidate = (raw ?? {}) as RawEntailment;
  return {
    enabled: Boolean(candidate.enabled),
    judgeKind: readString(candidate.judge_kind) || "heuristic",
    threshold: readNumber(candidate.threshold),
  };
}

export function parseEvaluationStatusPayload(raw: unknown): EvaluationStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  return {
    ragas: parseRagas(candidate.ragas),
    telemetry: parseTelemetry(candidate.telemetry),
    entailment: parseEntailment(candidate.entailment),
  };
}
