/** Task snapshot fragments from WS / HTTP; extend as the UI migration continues. */
export type TaskStatus =
  | "pending"
  | "running"
  | "in_progress"
  | "completed"
  | "failed"
  | "awaiting_human"
  | "awaiting_shell_confirm"
  | "cancelled";

export interface TaskHistoryEntry {
  agent?: string;
  message?: string;
}

export interface TaskSnapshot {
  status?: TaskStatus;
  error?: unknown;
  history?: TaskHistoryEntry[];
  agents?: string[];
}
