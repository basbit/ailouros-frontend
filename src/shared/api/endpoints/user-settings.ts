import { fetchJson } from "@/shared/api/client";

export interface UserSettingsDto {
  tavily_api_key: string;
  exa_api_key: string;
  scrapingdog_api_key: string;
  github_token: string;

  swarm_self_verify: boolean;
  swarm_self_verify_model: string;
  swarm_self_verify_provider: string;
  swarm_auto_approve: string;
  swarm_auto_approve_timeout: string;
  swarm_auto_retry: boolean;
  swarm_max_step_retries: string;
  swarm_deep_planning: boolean;
  swarm_deep_planning_model: string;
  swarm_deep_planning_provider: string;
  swarm_background_agent: boolean;
  swarm_background_agent_model: string;
  swarm_background_agent_provider: string;
  swarm_background_watch_paths: string;
  swarm_dream_enabled: boolean;
  swarm_quality_gate: boolean;
  swarm_auto_plan: boolean;
  swarm_planner_model: string;
  swarm_planner_provider: string;

  swarm_notify_enabled: boolean;
  swarm_notify_min_severity: string;
  swarm_notify_rate_limit_per_min: string;
  swarm_notify_webhook_url: string;
  swarm_notify_webhook_token: string;
  swarm_notify_email_sender: string;
  swarm_notify_email_recipients: string;
  swarm_notify_smtp_host: string;
  swarm_notify_smtp_port: string;
  swarm_notify_smtp_tls: boolean;
  swarm_notify_smtp_user: string;
  swarm_notify_smtp_password: string;
  swarm_notify_telegram_bot_token: string;
  swarm_notify_telegram_chat_id: string;
  swarm_notify_slack_webhook_url: string;
  swarm_notify_discord_webhook_url: string;
}

export async function getUserSettings(): Promise<Partial<UserSettingsDto>> {
  return fetchJson<Partial<UserSettingsDto>>("/v1/user/settings");
}

export async function putUserSettings(
  payload: Partial<UserSettingsDto>,
): Promise<void> {
  await fetchJson<{ ok: boolean; saved: string[] }>("/v1/user/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
