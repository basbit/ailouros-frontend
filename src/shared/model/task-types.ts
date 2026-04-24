/** Shared task snapshot fragments from WS / HTTP. */
export type TaskStatus =
  | "pending"
  | "running"
  | "in_progress"
  | "completed"
  | "completed_no_writes"
  | "completed_with_failures"
  | "failed"
  | "blocked"
  | "awaiting_human"
  | "awaiting_shell_confirm"
  | "awaiting_manual_shell"
  | "cancelled";

export type OrchestratorSseEventName =
  | "run_started"
  | "step_started"
  | "step_completed"
  | "step_retry_started"
  | "verification_layer_started"
  | "verification_layer_completed"
  | "pipeline_blocked"
  | "final_gate_denied"
  | "run_finished";

export interface OrchestratorSseEvent {
  agent: "orchestrator";
  status: "progress" | "blocked" | "completed" | "failed";
  event: OrchestratorSseEventName;
  step?: string;
  timestamp: string;
  message: string;
  code?: string;
  reason?: string;
}

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
