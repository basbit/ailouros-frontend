type StageVerdict = "RUN" | "REUSE" | "UPDATE" | "SKIP";

const VALID_VERDICTS: readonly StageVerdict[] = ["RUN", "REUSE", "UPDATE", "SKIP"];

interface StageDecision {
  readonly stage: string;
  readonly verdict: StageVerdict;
  readonly confidence: number;
  readonly reason: string;
  readonly sourceRef: string;
}

export interface RunPlan {
  readonly taskId: string;
  readonly available: boolean;
  readonly decisions: readonly StageDecision[];
}

function asVerdict(raw: unknown): StageVerdict {
  const value = String(raw ?? "").toUpperCase();
  return (VALID_VERDICTS as readonly string[]).includes(value)
    ? (value as StageVerdict)
    : "RUN";
}

function asNumber(raw: unknown): number {
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function parseRunPlanPayload(raw: unknown): RunPlan | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const taskId = typeof record.task_id === "string" ? record.task_id : "";
  if (!taskId) return null;
  const available = record.available === true;
  const rawDecisions =
    typeof record.decisions === "object" && record.decisions !== null
      ? (record.decisions as Record<string, unknown>)
      : {};
  const decisions: StageDecision[] = [];
  for (const [stage, entry] of Object.entries(rawDecisions)) {
    if (typeof entry !== "object" || entry === null) continue;
    const decision = entry as Record<string, unknown>;
    decisions.push({
      stage,
      verdict: asVerdict(decision.verdict),
      confidence: asNumber(decision.confidence),
      reason: typeof decision.reason === "string" ? decision.reason : "",
      sourceRef: typeof decision.source_ref === "string" ? decision.source_ref : "",
    });
  }
  return { taskId, available, decisions };
}
