/**
 * Secrets that stay on the server only: once saved, the browser keeps the mask,
 * never the value, so they do not linger in localStorage.
 */
export const SERVER_ONLY_SECRET_KEYS: readonly string[] = [
  "swarm_telegram_ingress_bot_token",
  "swarm_action_link_secret",
  "swarm_action_link_secret_prev",
  "swarm_github_webhook_secret",
  "swarm_linear_webhook_secret",
];

const SECRET_KEYS = new Set<string>([
  "tavily_api_key",
  "exa_api_key",
  "scrapingdog_api_key",
  "github_token",
  "swarm_notify_webhook_token",
  "swarm_notify_smtp_password",
  "swarm_notify_telegram_bot_token",
  "swarm_notify_slack_webhook_url",
  "swarm_notify_discord_webhook_url",
  ...SERVER_ONLY_SECRET_KEYS,
]);

export const MASKED_SECRET = "***";

export function isMaskedSecret(key: string, value: unknown): boolean {
  return SECRET_KEYS.has(key) && value === MASKED_SECRET;
}

export function isSecretSettingKey(key: string): boolean {
  return SECRET_KEYS.has(key);
}
