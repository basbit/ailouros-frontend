import { ApiError, httpGet } from "@/shared/api/http";
import type { components } from "@/shared/api/openapi-types";

export type EffectReport = components["schemas"]["EffectReportResponse"];
export type DayRunCount = components["schemas"]["DayRunCountResponse"];
type EffectMetricsResponse = components["schemas"]["EffectMetricsResponse"];

export interface EffectQuery {
  from: string;
  to: string;
  workspaceRoot: string;
}

/** A refused query answers `{ok: false, error}` (400) or FastAPI's `{detail}` (422). */
function refusalReason(error: ApiError): string {
  try {
    const parsed = JSON.parse(error.body ?? "") as {
      error?: unknown;
      detail?: unknown;
    };
    if (typeof parsed.error === "string" && parsed.error) return parsed.error;
    if (parsed.detail !== undefined) return JSON.stringify(parsed.detail);
  } catch {
    return error.message;
  }
  return error.message;
}

export async function getEffectMetrics(query: EffectQuery): Promise<EffectReport> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.workspaceRoot) params.set("workspace_root", query.workspaceRoot);
  let response: EffectMetricsResponse;
  try {
    response = await httpGet<EffectMetricsResponse>(`/v1/metrics/effect?${params}`);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.body) throw new Error(refusalReason(error));
    throw error;
  }
  if (!response.ok || !response.report) {
    throw new Error(response.error || "effect metrics request failed");
  }
  return response.report;
}
