import { fetchJson } from "@/shared/api/client";

export interface UserSettingsDto {
  // Secret API keys (masked on GET, stored in env)
  tavily_api_key: string;
  exa_api_key: string;
  scrapingdog_api_key: string;

  // Global Automation & Quality settings (persisted in var/user_settings.json)
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
