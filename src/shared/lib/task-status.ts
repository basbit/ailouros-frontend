import type { TaskStatus } from "@/shared/model/task-types";

export const ACTIVE_TASK_STATUSES = [
  "running",
  "in_progress",
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
] as const;

/** Statuses in which the run is paused on a question for the operator. */
export const AWAITING_TASK_STATUSES = [
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
] as const;

export const TERMINAL_TASK_STATUSES = [
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "blocked",
  "cancelled",
  "artifacts_incomplete",
] as const;

/**
 * Every status the UI understands. The server-side run history derives a run's
 * status from its artifacts and can name any of these, so a value outside the
 * list is a vocabulary drift between the two sides, not a value to guess at.
 */
export const KNOWN_TASK_STATUSES = [
  "pending",
  "running",
  "in_progress",
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "blocked",
  "awaiting_human",
  "awaiting_shell",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
  "cancelled",
  "artifacts_incomplete",
] as const;

/**
 * Statuses a run can be resumed from (History list and detail must agree).
 * `running` / `in_progress` are here for runs that died mid-flight and were
 * never marked finished.
 */
export const RESUMABLE_TASK_STATUSES = [
  "failed",
  "cancelled",
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
  "completed_with_failures",
  "completed_no_writes",
  "in_progress",
  "running",
] as const;

/** The status as a known `TaskStatus`, or `null` when the UI has no such value. */
export function parseTaskStatus(raw: string | null | undefined): TaskStatus | null {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  return (KNOWN_TASK_STATUSES as readonly string[]).includes(value)
    ? (value as TaskStatus)
    : null;
}

export function isTaskActive(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

export function isTaskAwaiting(status: string | null | undefined): boolean {
  return (AWAITING_TASK_STATUSES as readonly string[]).includes(
    String(status ?? "").toLowerCase(),
  );
}

export function isTaskTerminal(status: string): boolean {
  return (TERMINAL_TASK_STATUSES as readonly string[]).includes(status);
}

export function isTaskResumable(status: string | null | undefined): boolean {
  return (RESUMABLE_TASK_STATUSES as readonly string[]).includes(
    String(status ?? "").toLowerCase(),
  );
}

/** The gate flags of the live run, as the ui store keeps them. */
export interface LiveGateFlags {
  taskId: string | null;
  humanGateVisible: boolean;
  shellGateVisible: boolean;
  manualShellGateVisible: boolean;
  pendingApprovals: number;
}

export function hasVisibleGate(live: LiveGateFlags): boolean {
  return (
    live.humanGateVisible ||
    live.shellGateVisible ||
    live.manualShellGateVisible ||
    live.pendingApprovals > 0
  );
}

/**
 * Whether a run (a history entry, a snapshot) is waiting on the operator:
 * either its own status says so, or it is the live run and one of its gate
 * forms is open. The live flags belong to `live.taskId` only, so a different
 * run never inherits them.
 */
export function isRunAwaiting(
  run: { taskId?: string | null; status?: string | null },
  live: LiveGateFlags,
): boolean {
  if (isTaskAwaiting(run.status)) return true;
  const taskId = (run.taskId ?? "").trim();
  return Boolean(taskId) && taskId === live.taskId && hasVisibleGate(live);
}

/** Localised status label; falls back to the raw status when no key exists. */
export function formatTaskStatus(
  t: (key: string) => string,
  status: string | null | undefined,
  fallback = "—",
): string {
  if (!status) return fallback;
  const key = `history.${status}`;
  const translated = t(key);
  return translated !== key ? translated : String(status);
}
