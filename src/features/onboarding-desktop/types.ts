import type { BootstrapStage, BootstrapProgress } from "@/shared/model/bootstrap-types";

export type { BootstrapStage, BootstrapProgress };

export interface StageStatus {
  stage: BootstrapStage;
  done: boolean;
}

export interface BootstrapStatusView {
  stages: StageStatus[];
  default_model_present: boolean;
  default_model_skipped: boolean;
  first_run_complete: boolean;
  all_required_done: boolean;
}

export type StageRuntimeState = "pending" | "active" | "done" | "skipped" | "error";

export interface StageRuntimeView {
  stage: BootstrapStage;
  state: StageRuntimeState;
  fraction: number;
  message: string;
}
