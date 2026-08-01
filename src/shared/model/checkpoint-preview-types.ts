export interface CheckpointConcern {
  readonly path: string;
  readonly tags: readonly string[];
}

export interface CheckpointHotspot {
  readonly what: string;
  readonly where: readonly string[];
  readonly tags: readonly string[];
  readonly severity: string;
}

export interface CheckpointManualCheck {
  readonly do: string;
  readonly expect: string;
}

export interface CheckpointDeferred {
  readonly title: string;
  readonly stepId: string;
}

export interface CheckpointPreview {
  readonly stepId: string;
  readonly concerns: readonly CheckpointConcern[];
  readonly riskHotspots: readonly CheckpointHotspot[];
  readonly manualChecks: readonly CheckpointManualCheck[];
  readonly deferred: readonly CheckpointDeferred[];
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function readObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is Record<string, unknown> =>
      !!entry && typeof entry === "object" && !Array.isArray(entry),
  );
}

export function parseCheckpointPreview(raw: unknown): CheckpointPreview | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, unknown>;

  const concerns = readObjectArray(candidate.concerns)
    .map((entry) => ({
      path: readString(entry.path),
      tags: readStringArray(entry.tags),
    }))
    .filter((entry) => entry.path !== "");

  const riskHotspots = readObjectArray(candidate.risk_hotspots)
    .map((entry) => ({
      what: readString(entry.what),
      where: readStringArray(entry.where),
      tags: readStringArray(entry.tags),
      severity: readString(entry.severity),
    }))
    .filter((entry) => entry.what !== "");

  const manualChecks = readObjectArray(candidate.manual_checks)
    .map((entry) => ({ do: readString(entry.do), expect: readString(entry.expect) }))
    .filter((entry) => entry.do !== "" || entry.expect !== "");

  const deferred = readObjectArray(candidate.deferred)
    .map((entry) => ({
      title: readString(entry.title),
      stepId: readString(entry.step_id),
    }))
    .filter((entry) => entry.title !== "");

  const empty =
    concerns.length === 0 &&
    riskHotspots.length === 0 &&
    manualChecks.length === 0 &&
    deferred.length === 0;
  if (empty) return null;

  return {
    stepId: readString(candidate.step_id),
    concerns,
    riskHotspots,
    manualChecks,
    deferred,
  };
}
