/** The `agent` the task store labels a phase-gate pause with. */
const PHASE_GATE_AGENT = "phase_gate";

interface HistoryRowLike {
  agent?: unknown;
}

/**
 * Whether an `awaiting_human` pause belongs to a phase gate. The backend
 * reports the pause by appending a history row with `agent: "phase_gate"`
 * (`_report_gate_to_task_store`); no task store ever writes a top-level
 * `agent`, so only the last history row can tell the two pauses apart.
 */
export function isPhaseGatePause(history: unknown): boolean {
  if (!Array.isArray(history) || history.length === 0) return false;
  const last = history[history.length - 1] as HistoryRowLike | null | undefined;
  return String(last?.agent ?? "") === PHASE_GATE_AGENT;
}
