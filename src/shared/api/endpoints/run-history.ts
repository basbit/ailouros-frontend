import { ApiError, httpGet } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";

type RunHistoryApiResponse =
  paths["/v1/runs"]["get"]["responses"][200]["content"]["application/json"];

/** One run as the backend read it back off disk. */
export interface ServerRunRow {
  readonly taskId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly prompt: string;
  readonly promptTruncated: boolean;
  readonly scenarioId: string | null;
  readonly scenarioTitle: string | null;
  readonly status: string;
  readonly pipelineSteps: readonly string[];
  readonly workspaceRoot: string;
  readonly hasPipelineSnapshot: boolean;
}

export interface ServerRunListing {
  readonly runs: readonly ServerRunRow[];
  /** Runs on disk, which is larger than `runs.length` once the cap bites. */
  readonly total: number;
  /** Runs whose artifacts could not be parsed; the backend logged each one. */
  readonly unreadable: number;
}

export interface ListServerRunsInput {
  readonly limit?: number;
  readonly workspaceRoot?: string;
  readonly signal?: AbortSignal;
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asOptionalText(value: unknown): string | null {
  const text = asText(value).trim();
  return text ? text : null;
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseRun(raw: unknown): ServerRunRow {
  if (!raw || typeof raw !== "object") {
    throw new ApiError("run history returned a row that is not an object", 200);
  }
  const row = raw as Record<string, unknown>;
  const taskId = asText(row.task_id).trim();
  if (!taskId) {
    throw new ApiError("run history returned a row without a task id", 200);
  }
  const steps = Array.isArray(row.pipeline_steps)
    ? row.pipeline_steps.map((step) => String(step))
    : [];
  return {
    taskId,
    createdAt: asText(row.created_at),
    updatedAt: asText(row.updated_at),
    prompt: asText(row.prompt),
    promptTruncated: row.prompt_truncated === true,
    scenarioId: asOptionalText(row.scenario_id),
    scenarioTitle: asOptionalText(row.scenario_title),
    status: asText(row.status),
    pipelineSteps: steps,
    workspaceRoot: asText(row.workspace_root),
    hasPipelineSnapshot: row.has_pipeline_snapshot === true,
  };
}

export async function listServerRuns(
  input: ListServerRunsInput = {},
): Promise<ServerRunListing> {
  const params = new URLSearchParams();
  if (input.limit !== undefined) params.set("limit", String(input.limit));
  const workspaceRoot = (input.workspaceRoot ?? "").trim();
  if (workspaceRoot) params.set("workspace_root", workspaceRoot);
  const query = params.toString();
  const raw = await httpGet<RunHistoryApiResponse>(
    query ? `/v1/runs?${query}` : "/v1/runs",
    { signal: input.signal },
  );
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.runs)) {
    throw new ApiError("run history returned a malformed payload", 200, String(raw));
  }
  return {
    runs: raw.runs.map(parseRun),
    total: asCount(raw.total),
    unreadable: asCount(raw.unreadable),
  };
}
