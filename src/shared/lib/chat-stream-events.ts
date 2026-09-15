import {
  parseRetrievalDonePayload,
  type RetrievalDoneEvent,
} from "@/shared/model/streaming-rag-types";
import type {
  OrchestratorSseEvent,
  OrchestratorSseEventName,
} from "@/shared/model/task-types";

interface AutoApprovedEvent {
  kind: "auto_approved";
  step: string;
  rule?: string | null;
  audit?: Record<string, unknown> | null;
}

interface RetrievalDoneStreamEvent {
  kind: "retrieval_done";
  event: RetrievalDoneEvent;
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

interface McpStatusEvent {
  kind: "mcp_status";
  step: string | null;
  code: string | null;
  reason: string | null;
  action: string | null;
  explicitFallback: boolean;
  message: string;
  timestamp: string;
}

type PreflightPhase = "session" | "mcp" | "model" | "change_step" | "code_generator";

interface PreflightStreamEvent {
  kind: "preflight";
  phase: PreflightPhase;
  status: string;
  message: string;
  code: string | null;
}

interface ScenarioStreamEvent {
  kind: "scenario";
  id: string;
  title: string;
  category: string;
  warnings: string[];
}

interface WorkspaceIndexStatsStreamEvent {
  kind: "workspace_index_stats";
  stats: Record<string, unknown>;
}

/** The orchestrator's closing account of the run, anchored to workspace_truth. */
interface RunSummaryStreamEvent {
  kind: "run_summary";
  text: string;
}

export type ChatStreamEvent =
  | RunSummaryStreamEvent
  | AutoApprovedEvent
  | OrchestratorStreamEvent
  | McpStatusEvent
  | RetrievalDoneStreamEvent
  | PreflightStreamEvent
  | ScenarioStreamEvent
  | WorkspaceIndexStatsStreamEvent
  | AwaitingClarificationStreamEvent
  | OrchestratorStatusLineStreamEvent;

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

const PREFLIGHT_SIBLING_KEYS: ReadonlyArray<readonly [string, PreflightPhase]> = [
  ["session_preflight", "session"],
  ["mcp_preflight", "mcp"],
  ["model_preflight", "model"],
  ["change_step_preflight", "change_step"],
  ["code_generator_preflight", "code_generator"],
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

interface AwaitingClarificationStreamEvent {
  kind: "awaiting_clarification";
  stepId: string;
  questions: { index: number; text: string; options: string[] }[];
}

function buildAwaitingClarificationEvent(
  raw: Record<string, unknown>,
): AwaitingClarificationStreamEvent | null {
  const rawQuestions = Array.isArray(raw["questions"]) ? raw["questions"] : [];
  const questions: { index: number; text: string; options: string[] }[] = [];
  for (const question of rawQuestions) {
    const record = asRecord(question);
    if (!record) continue;
    questions.push({
      index: Number(record["index"] ?? 0),
      text: String(record["text"] ?? ""),
      options: Array.isArray(record["options"]) ? record["options"].map(String) : [],
    });
  }
  if (!questions.length) return null;
  return {
    kind: "awaiting_clarification",
    stepId: String(raw["step_id"] ?? ""),
    questions,
  };
}

function buildPreflightStreamEvent(
  phase: PreflightPhase,
  raw: Record<string, unknown>,
): PreflightStreamEvent {
  const message = String(raw["message"] ?? raw["error"] ?? "");
  const code =
    typeof raw["error_code"] === "string"
      ? (raw["error_code"] as string)
      : typeof raw["code"] === "string"
        ? (raw["code"] as string)
        : null;
  return {
    kind: "preflight",
    phase,
    status: typeof raw["status"] === "string" ? (raw["status"] as string) : "",
    message,
    code,
  };
}

function buildScenarioStreamEvent(raw: Record<string, unknown>): ScenarioStreamEvent {
  return {
    kind: "scenario",
    id: String(raw["id"] ?? ""),
    title: String(raw["title"] ?? ""),
    category: String(raw["category"] ?? ""),
    warnings: Array.isArray(raw["warnings"]) ? raw["warnings"].map(String) : [],
  };
}

export function parseChatStreamSiblingExtra(
  payload: Record<string, unknown>,
): ChatStreamEvent | null {
  const retrievalDoneRaw = payload["retrieval_done"];
  if (retrievalDoneRaw !== undefined) {
    const event = parseRetrievalDonePayload(retrievalDoneRaw);
    if (event) return { kind: "retrieval_done", event };
  }
  const awaitingClarificationRaw = asRecord(payload["awaiting_clarification"]);
  if (awaitingClarificationRaw) {
    const event = buildAwaitingClarificationEvent(awaitingClarificationRaw);
    if (event) return event;
  }
  for (const [key, phase] of PREFLIGHT_SIBLING_KEYS) {
    if (key in payload) {
      const raw = asRecord(payload[key]);
      if (raw) return buildPreflightStreamEvent(phase, raw);
    }
  }
  const scenarioRaw = asRecord(payload["scenario"]);
  if (scenarioRaw) return buildScenarioStreamEvent(scenarioRaw);
  const indexStatsRaw = asRecord(payload["workspace_index_stats"]);
  if (indexStatsRaw) return { kind: "workspace_index_stats", stats: indexStatsRaw };
  const runSummaryRaw = asRecord(payload["run_summary"]);
  if (runSummaryRaw) {
    return { kind: "run_summary", text: String(runSummaryRaw["text"] ?? "") };
  }
  return null;
}

interface OrchestratorStatusLineStreamEvent {
  kind: "orchestrator_status_line";
  status: string;
  detail: string;
}

const ORCHESTRATOR_STATUS_LINE_PREFIX = "[orchestrator] ";

/**
 * Fallback for the plain-text status lines the pipeline emits on stream
 * failure/pause (e.g. "[orchestrator] awaiting_human: ..."). The WS ticks are
 * the primary channel; this only makes the status land instantly on streams
 * that end before the first tick (resume/retry paths).
 */
function parseOrchestratorStatusLine(
  content: string,
): OrchestratorStatusLineStreamEvent | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith(ORCHESTRATOR_STATUS_LINE_PREFIX)) return null;
  const rest = trimmed.slice(ORCHESTRATOR_STATUS_LINE_PREFIX.length);
  const colonIndex = rest.indexOf(":");
  const status = colonIndex === -1 ? rest.trim() : rest.slice(0, colonIndex).trim();
  if (!/^[a-z_]+$/.test(status)) return null;
  const detail = colonIndex === -1 ? "" : rest.slice(colonIndex + 1).trim();
  return { kind: "orchestrator_status_line", status, detail };
}

export function parseChatStreamEvent(content: string): ChatStreamEvent | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const orchestratorLine = parseOrchestratorEventLine(trimmed);
  if (orchestratorLine) return orchestratorLine;
  if (trimmed.charAt(0) !== "{") {
    return parseOrchestratorStatusLine(trimmed);
  }
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
