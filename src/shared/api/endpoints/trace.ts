import { httpGet } from "@/shared/api/http";

export interface TraceEventItem {
  readonly eventId: string;
  readonly traceId: string;
  readonly sessionId: string;
  readonly taskId: string;
  readonly step: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly data: Record<string, unknown>;
  readonly parentEventId: string | null;
  readonly promptFiles: readonly string[];
}

export interface TaskTrace {
  readonly taskId: string;
  readonly collector: string;
  readonly events: readonly TraceEventItem[];
}

interface RawPayload {
  [key: string]: unknown;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function readEvents(value: unknown): TraceEventItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is Record<string, unknown> => !!entry && typeof entry === "object",
    )
    .map((raw) => {
      const event = raw as RawPayload;
      const parent = event.parent_event_id;
      return {
        eventId: asString(event.event_id),
        traceId: asString(event.trace_id),
        sessionId: asString(event.session_id),
        taskId: asString(event.task_id),
        step: asString(event.step),
        eventType: asString(event.event_type),
        timestamp: asString(event.timestamp),
        data: asRecord(event.data),
        parentEventId: typeof parent === "string" && parent ? parent : null,
        promptFiles: readStringList(event.prompt_files),
      };
    });
}

function parseTaskTracePayload(raw: unknown): TaskTrace | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPayload;
  if (typeof candidate.events === "undefined") return null;
  return {
    taskId: asString(candidate.task_id),
    collector: asString(candidate.collector),
    events: readEvents(candidate.events),
  };
}

export async function getTaskTrace(taskId: string): Promise<TaskTrace | null> {
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/trace/${encodeURIComponent(taskId)}`,
  );
  return parseTaskTracePayload(raw);
}
