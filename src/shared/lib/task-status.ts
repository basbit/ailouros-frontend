export const ACTIVE_TASK_STATUSES = [
  "running",
  "in_progress",
  "awaiting_human",
  "awaiting_shell_confirm",
  "awaiting_manual_shell",
] as const;

export type ActiveTaskStatus = (typeof ACTIVE_TASK_STATUSES)[number];

/**
 * Terminal statuses the backend can assign to a finished run. Kept in sync
 * with ``TaskStatus`` in ``shared/model/task-types.ts`` and with the
 * verdict codes emitted by ``apply_final_success_gate`` on the backend. A
 * status is terminal iff the pipeline cannot progress further without a new
 * run, so the UI should stop animating and render the final verdict.
 */
export const TERMINAL_TASK_STATUSES = [
  "completed",
  "completed_no_writes",
  "completed_with_failures",
  "failed",
  "blocked",
  "cancelled",
] as const;

export type TerminalTaskStatus = (typeof TERMINAL_TASK_STATUSES)[number];

export function isTaskActive(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

export function isTaskTerminal(status: string): boolean {
  return (TERMINAL_TASK_STATUSES as readonly string[]).includes(status);
}
