export interface CreateGoalPayload {
  title: string;
  description: string;
  success_criteria: string[];
  owner_role?: string;
  trigger?: { kind: "manual" | "cron" | "event"; cron?: string; event?: string };
  depends_on_specs?: string[];
  workspace_root?: string;
}
