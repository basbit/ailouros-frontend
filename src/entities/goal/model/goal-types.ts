export interface CreateGoalPayload {
  title: string;
  description: string;
  success_criteria: string[];
  owner_role?: string;
  /** Cron schedules go through POST /v1/goals/{id}/schedule, not here. */
  trigger?: { kind: "manual" };
  depends_on_specs?: string[];
  workspace_root?: string;
}
