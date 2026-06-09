import { ApiError, httpGet } from "@/shared/api/http";
import {
  parseCodeGraphContext,
  parseCodeGraphResponse,
  type CodeGraphContext,
  type CodeGraphResponse,
} from "@/shared/model/code-graph-types";

export async function getCodeGraph(workspaceRoot: string): Promise<CodeGraphResponse> {
  const query = encodeURIComponent(workspaceRoot);
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/codegraph?workspace_root=${query}`,
  );
  const parsed = parseCodeGraphResponse(raw);
  if (!parsed) {
    throw new ApiError(
      "code graph returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}

export async function getCodeGraphContext(
  workspaceRoot: string,
  nodeId: string,
): Promise<CodeGraphContext> {
  const query = encodeURIComponent(workspaceRoot);
  const node = encodeURIComponent(nodeId);
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/codegraph/context?workspace_root=${query}&node_id=${node}`,
  );
  const parsed = parseCodeGraphContext(raw);
  if (!parsed) {
    throw new ApiError(
      "code graph context returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
