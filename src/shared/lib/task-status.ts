export const ACTIVE_TASK_STATUSES = [
  "running",
  "in_progress",
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
] as const;

export function isTaskActive(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}

export function isTaskTerminal(status: string): boolean {
  return (TERMINAL_TASK_STATUSES as readonly string[]).includes(status);
}
