export const ACTIVE_TASK_STATUSES = [
  "running",
  "in_progress",
  "awaiting_human",
  "awaiting_shell_confirm",
] as const;

export type ActiveTaskStatus = (typeof ACTIVE_TASK_STATUSES)[number];

export function isTaskActive(status: string): boolean {
  return (ACTIVE_TASK_STATUSES as readonly string[]).includes(status);
}
