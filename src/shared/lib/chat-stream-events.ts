import type {
  OrchestratorSseEvent,
  OrchestratorSseEventName,
} from "@/entities/task/model/types";

export interface AutoApprovedEvent {
  kind: "auto_approved";
  step: string;
  rule?: string | null;
  audit?: Record<string, unknown> | null;
}

export interface OrchestratorStreamEvent {
  kind: "orchestrator";
  event: OrchestratorSseEventName;
  status: OrchestratorSseEvent["status"];
  step: string | null;
  message: string;
  timestamp: string;
  code: string | null;
  reason: string | null;
}

export interface McpStatusEvent {
  kind: "mcp_status";
  step: string | null;
  code: string | null;
  reason: string | null;
  action: string | null;
  explicitFallback: boolean;
  message: string;
  timestamp: string;
}

export type ChatStreamEvent =
  | AutoApprovedEvent
  | OrchestratorStreamEvent
  | McpStatusEvent;

const ORCHESTRATOR_EVENT_LINE_PREFIX = "[orchestrator-event]";

const ORCHESTRATOR_EVENT_NAMES: ReadonlySet<OrchestratorSseEventName> = new Set([
  "run_started",
  "step_started",
  "step_completed",
  "step_retry_started",
  "verification_layer_started",
  "verification_layer_completed",
  "pipeline_blocked",
  "final_gate_denied",
  "run_finished",
]);

function buildOrchestratorStreamEvent(
  obj: Record<string, unknown>,
): OrchestratorStreamEvent | null {
  const eventName = obj["event"] as OrchestratorSseEventName | undefined;
  if (!eventName || !ORCHESTRATOR_EVENT_NAMES.has(eventName)) return null;
  const status = (obj["status"] as OrchestratorSseEvent["status"]) ?? "progress";
  return {
    kind: "orchestrator",
    event: eventName,
    status,
    step: typeof obj["step"] === "string" ? (obj["step"] as string) : null,
    message: String(obj["message"] ?? ""),
    timestamp: String(obj["timestamp"] ?? ""),
    code: typeof obj["code"] === "string" ? (obj["code"] as string) : null,
    reason: typeof obj["reason"] === "string" ? (obj["reason"] as string) : null,
  };
}

function parseOrchestratorEventLine(line: string): OrchestratorStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith(ORCHESTRATOR_EVENT_LINE_PREFIX)) return null;
  const colonIndex = trimmed.indexOf(":", ORCHESTRATOR_EVENT_LINE_PREFIX.length);
  if (colonIndex === -1) return null;
  const jsonFragment = trimmed.slice(colonIndex + 1).trim();
  if (!jsonFragment.startsWith("{")) return null;
  try {
    const obj = JSON.parse(jsonFragment) as Record<string, unknown>;
    return buildOrchestratorStreamEvent(obj);
  } catch {
    return null;
  }
}

export function parseChatStreamEvent(content: string): ChatStreamEvent | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const orchestratorLine = parseOrchestratorEventLine(trimmed);
  if (orchestratorLine) return orchestratorLine;
  if (trimmed.charAt(0) !== "{") return null;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    if (obj["agent"] === "orchestrator") {
      const orchestratorEvent = buildOrchestratorStreamEvent(obj);
      if (orchestratorEvent) return orchestratorEvent;
    }
    const disc = (obj["status"] ?? obj["_event_type"]) as string | undefined;
    if (disc === "mcp_status") {
      return {
        kind: "mcp_status",
        step: typeof obj["step"] === "string" ? (obj["step"] as string) : null,
        code: typeof obj["code"] === "string" ? (obj["code"] as string) : null,
        reason: typeof obj["reason"] === "string" ? (obj["reason"] as string) : null,
        action: typeof obj["action"] === "string" ? (obj["action"] as string) : null,
        explicitFallback: Boolean(obj["explicit_fallback"]),
        message: String(obj["message"] ?? ""),
        timestamp: String(obj["timestamp"] ?? ""),
      };
    }
    if (disc !== "auto_approved") return null;
    return {
      kind: "auto_approved",
      step: String(obj["step"] ?? ""),
      rule: (obj["rule"] as string | undefined) ?? null,
      audit: (obj["audit"] as Record<string, unknown> | undefined) ?? null,
    };
  } catch {
    return null;
  }
}
