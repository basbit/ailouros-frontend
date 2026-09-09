export interface ForkStepRequest {
  step_id: string;
  new_task_id?: string;
  notes?: string;
}

export interface ForkStepResponse {
  forked_task_id: string;
  parent_task_id: string;
  step_id: string;
  snapshot_keys: string[];
  message: string;
}
