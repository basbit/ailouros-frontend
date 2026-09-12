export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  role: string;
  expected_artifact?: string | null;
}

export interface PlaybookParameter {
  name: string;
  parameter_type: string;
  description: string;
  default?: string | null;
  required: boolean;
}

export interface Playbook {
  id: string;
  name: string;
  category: string;
  description: string;
  target_scenario_id: string;
  steps: PlaybookStep[];
  parameters: PlaybookParameter[];
}

export interface RunPlaybookRequest {
  parameters: Record<string, unknown>;
}

/** Materialised run request. Running a playbook no longer creates a task of
 * its own — the caller feeds `prompt` + `scenario_id` to the normal run entry
 * point, so there is exactly one task and it is a real one. */
export interface RunPlaybookResponse {
  playbook_id: string;
  playbook_name: string;
  prompt: string;
  scenario_id: string;
  parameters: Record<string, string>;
}
