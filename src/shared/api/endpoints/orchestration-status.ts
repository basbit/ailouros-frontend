import {
  parseOrchestrationStatusPayload,
  type OrchestrationStatusSnapshot,
} from "@/shared/model/orchestration-status-types";
import { ApiError, httpGet } from "@/shared/api/http";

export interface GetOrchestrationStatusOptions {
  scenario: string;
  workspaceRoot?: string | null;
  signal?: AbortSignal;
}

export async function getOrchestrationStatus(
  options: GetOrchestrationStatusOptions,
): Promise<OrchestrationStatusSnapshot> {
  const params = new URLSearchParams({ scenario: options.scenario });
  if (options.workspaceRoot) {
    params.set("workspace_root", options.workspaceRoot);
  }
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/orchestration/status?${params.toString()}`,
    { signal: options.signal },
  );
  const parsed = parseOrchestrationStatusPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "orchestration-status returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
