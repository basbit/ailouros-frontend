export interface TurnPipelineStep {
  id: string;
  state: "active" | "completed" | "failed" | "pending";
}

export interface TurnPipelineLogLine {
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

/**
 * Read-only per-turn pipeline progress contract consumed by
 * TurnPipelineBar (features/chat) and produced by
 * useTurnPipelineSummary (pages/chat).
 */
export interface TurnPipelineSummary {
  steps: import("vue").ComputedRef<TurnPipelineStep[]>;
  completedCount: import("vue").ComputedRef<number>;
  failedCount: import("vue").ComputedRef<number>;
  totalSteps: import("vue").ComputedRef<number>;
  activeStep: import("vue").ComputedRef<string | null>;
  latestLog: import("vue").ComputedRef<string>;
  logLines: import("vue").ComputedRef<TurnPipelineLogLine[]>;
  progressPct: import("vue").ComputedRef<number>;
  status: import("vue").ComputedRef<string>;
  isRunning: import("vue").ComputedRef<boolean>;
}
