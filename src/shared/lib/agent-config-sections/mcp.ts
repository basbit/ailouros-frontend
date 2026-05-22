import { useI18n } from "@/shared/lib/i18n";
import { agentConfigErrorMessage } from "@/shared/lib/agent-config-error";
import type { AgentConfigForm } from "@/shared/lib/agent-config-types";

type Translator = ReturnType<typeof useI18n>["t"];

interface NormalizedMcpConfig {
  servers: unknown[];
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSingleMcpServer(
  serverName: string,
  raw: Record<string, unknown>,
): Record<string, unknown> | null {
  if (raw.command === undefined || raw.command === null) return null;
  const normalized: Record<string, unknown> = {
    name: String(serverName).trim() || "mcp",
    command: raw.command,
  };
  if (Array.isArray(raw.args) && raw.args.length) normalized.args = raw.args;
  if (raw.cwd) normalized.cwd = raw.cwd;
  if (isObjectRecord(raw.env)) normalized.env = raw.env;
  return normalized;
}

function normalizeMcpServersDict(mcpServers: Record<string, unknown>): unknown[] {
  const servers: unknown[] = [];
  for (const [serverName, value] of Object.entries(mcpServers)) {
    if (!isObjectRecord(value)) continue;
    const normalized = normalizeSingleMcpServer(serverName, value);
    if (normalized) servers.push(normalized);
  }
  return servers;
}

function normalizeMcpConfig(parsed: unknown): NormalizedMcpConfig | null {
  if (!isObjectRecord(parsed)) return null;
  if (Array.isArray(parsed.servers) && parsed.servers.length) {
    return { servers: parsed.servers };
  }
  if (!isObjectRecord(parsed.mcpServers)) return null;
  const servers = normalizeMcpServersDict(parsed.mcpServers);
  if (!servers.length) return null;
  return { servers };
}

export function buildMcpSection(
  form: AgentConfigForm,
  translate: Translator,
): NormalizedMcpConfig | null | undefined {
  const rawJson = form.mcp_servers_json.trim();
  if (!rawJson) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    agentConfigErrorMessage.value = translate("errors.invalidMcpJson", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
  const normalized = normalizeMcpConfig(parsed);
  if (!normalized) {
    agentConfigErrorMessage.value = translate("errors.invalidMcpShape");
    return null;
  }
  return normalized;
}
