import type { AgentConfigForm } from "@/shared/lib/agent-config-types";

const ANTHROPIC_PROVIDER_ID = "anthropic";
const OPENAI_COMPATIBLE_PROVIDER_IDS: ReadonlySet<string> = new Set([
  "openai_compatible",
  "gemini",
  "groq",
  "cerebras",
  "openrouter",
  "deepseek",
  "ollama_cloud",
]);

function assembleRemoteApiFields(
  provider: string,
  apiKey: string,
  baseUrl: string,
): Record<string, string> {
  const remoteApi: Record<string, string> = { provider };
  if (apiKey) remoteApi.api_key = apiKey;
  if (baseUrl) remoteApi.base_url = baseUrl;
  return remoteApi;
}

export function buildRemoteApiSection(
  form: AgentConfigForm,
): Record<string, string> | undefined {
  const provider = form.remote_api_provider;
  const apiKey = form.remote_api_key.trim();
  const baseUrl = form.remote_api_base_url.trim();

  if (provider === ANTHROPIC_PROVIDER_ID) {
    if (!apiKey && !baseUrl) return undefined;
    return assembleRemoteApiFields(provider, apiKey, baseUrl);
  }
  if (OPENAI_COMPATIBLE_PROVIDER_IDS.has(provider)) {
    return assembleRemoteApiFields(provider, apiKey, baseUrl);
  }
  return undefined;
}
