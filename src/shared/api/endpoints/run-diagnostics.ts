import {
  parseRunDiagnosticsPayload,
  type RunDiagnostics,
} from "@/shared/model/run-diagnostics-types";
import { ApiError, httpGet } from "@/shared/api/http";

export interface GetRunDiagnosticsInput {
  taskId: string;
  workspaceRoot: string;
}

export async function getRunDiagnostics(
  input: GetRunDiagnosticsInput,
): Promise<RunDiagnostics> {
  const params = new URLSearchParams({ workspace_root: input.workspaceRoot });
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/run-diagnostics/${encodeURIComponent(input.taskId)}?${params.toString()}`,
  );
  const parsed = parseRunDiagnosticsPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "run-diagnostics returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
