import { httpDelete, httpGet, httpPost, httpPut } from "@/shared/api/http";

export type AutorunSource = "github" | "linear";

export interface AutorunRuleInput {
  source: AutorunSource;
  repository_key: string;
  workspace_root: string;
  scenario_id: string;
  label: string;
  target_branch: string;
  enabled: boolean;
  allow_command_exec: boolean;
}

export interface AutorunRule extends AutorunRuleInput {
  rule_id: string;
}

export interface AutorunStatus {
  github_secret_configured: boolean;
  linear_secret_configured: boolean;
  ready: boolean;
  not_ready_reason: string;
  github_webhook_path: string;
  linear_webhook_path: string;
}

export interface AutorunConfig {
  rules: AutorunRule[];
  status: AutorunStatus;
}

export interface AutorunEvent {
  recorded_at: string;
  kind: string;
  delivery_id: string;
  source: string;
  issue_url: string;
  message: string;
  task_id: string;
  pull_request_url: string;
  rule_id: string;
}

const BASE = "/v1/integrations/issues/autorun";

export function fetchAutorunConfig(): Promise<AutorunConfig> {
  return httpGet<AutorunConfig>(BASE);
}

export function createAutorunRule(rule: AutorunRuleInput): Promise<AutorunRule> {
  return httpPost<AutorunRule>(`${BASE}/rules`, rule);
}

export function updateAutorunRule(ruleId: string, rule: AutorunRuleInput): Promise<AutorunRule> {
  return httpPut<AutorunRule>(`${BASE}/rules/${encodeURIComponent(ruleId)}`, rule);
}

export function deleteAutorunRule(ruleId: string): Promise<unknown> {
  return httpDelete(`${BASE}/rules/${encodeURIComponent(ruleId)}`);
}

export async function fetchAutorunEvents(limit: number): Promise<AutorunEvent[]> {
  const data = await httpGet<{ events: AutorunEvent[] }>(`${BASE}/events?limit=${limit}`);
  return data.events ?? [];
}
