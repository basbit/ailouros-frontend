import { httpGet } from "@/shared/api/http";
import type {
  RetrievalTraceDetail,
  RetrievalTraceSummary,
} from "@/shared/model/retrieval-trace-types";

export interface RetrievalTraceListResponse {
  version: number;
  workspace_root: string;
  traces: RetrievalTraceSummary[];
}

export async function listRetrievalTraces(
  workspaceRoot: string,
  limit = 50,
): Promise<RetrievalTraceListResponse> {
  const params = new URLSearchParams({
    workspace_root: workspaceRoot,
    limit: String(limit),
  });
  return httpGet<RetrievalTraceListResponse>(
    `/v1/retrieval/traces?${params.toString()}`,
  );
}

export async function getRetrievalTrace(
  workspaceRoot: string,
  traceId: string,
): Promise<RetrievalTraceDetail> {
  const params = new URLSearchParams({ workspace_root: workspaceRoot });
  return httpGet<RetrievalTraceDetail>(
    `/v1/retrieval/traces/${encodeURIComponent(traceId)}?${params.toString()}`,
  );
}
