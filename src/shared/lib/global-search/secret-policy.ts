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
]);

const MASKED_SECRET = "***";

export function isMaskedSecret(key: string, value: unknown): boolean {
  return SECRET_KEYS.has(key) && value === MASKED_SECRET;
}
