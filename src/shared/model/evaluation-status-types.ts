interface RagasStatus {
  readonly enabled: boolean;
  readonly modelId: string;
}

interface TelemetryStatus {
  readonly enabled: boolean;
  readonly exporterKind: string;
}

interface EntailmentStatus {
  readonly enabled: boolean;
  readonly judgeKind: string;
  readonly modelId: string;
  readonly threshold: number;
}

export interface EvaluationStatus {
  readonly ragas: RagasStatus;
  readonly telemetry: TelemetryStatus;
  readonly entailment: EntailmentStatus;
}

interface RawRagas {
  enabled?: unknown;
  model_id?: unknown;
}

interface RawTelemetry {
  enabled?: unknown;
  exporter_kind?: unknown;
}

interface RawEntailment {
  enabled?: unknown;
  judge_kind?: unknown;
  model_id?: unknown;
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
    modelId: readString(candidate.model_id),
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
    modelId: readString(candidate.model_id),
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
