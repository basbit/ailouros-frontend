import { httpGet } from "@/shared/api/http";

export interface SpecGraphNodeDto {
  id: string;
  kind: string;
  payload?: Record<string, unknown>;
}

export interface SpecGraphEdgeDto {
  from: string;
  to: string;
  kind: string;
}

export interface SpecGraphDto {
  nodes?: SpecGraphNodeDto[];
  edges?: SpecGraphEdgeDto[];
}

export interface SpecDocumentDto {
  spec_id: string;
  version?: string;
  status?: string;
  privacy?: string;
  title?: string;
  hash_inputs?: string[];
  codegen_targets?: string[];
  depends_on?: string[];
  last_reviewed_by?: string | null;
  last_reviewed_at?: string | null;
  body: string;
  codegen_hash?: string;
}

export interface SpecShowDto {
  spec: SpecDocumentDto;
  dependencies: string[];
  dependants: string[];
}

function buildWorkspaceQuery(workspaceRoot: string, persist?: boolean): string {
  const search = new URLSearchParams();
  if (workspaceRoot.trim()) {
    search.set("workspace_root", workspaceRoot.trim());
  }
  if (typeof persist === "boolean") {
    search.set("persist", persist ? "true" : "false");
  }
  return search.size ? `?${search.toString()}` : "";
}

export async function getSpecGraph(
  workspaceRoot = "",
  persist = false,
): Promise<SpecGraphDto> {
  const qs = buildWorkspaceQuery(workspaceRoot, persist);
  return httpGet<SpecGraphDto>(`/v1/spec/graph${qs}`);
}

export async function showSpec(
  workspaceRoot: string,
  specId: string,
): Promise<SpecShowDto> {
  const search = new URLSearchParams();
  search.set("workspace_root", workspaceRoot.trim());
  search.set("spec_id", specId);
  return httpGet<SpecShowDto>(`/v1/spec/show?${search.toString()}`);
}

export interface SpecGraphDocumentDto {
  spec_id: string;
  agent: string;
  step_id: string;
  version: number;
  path: string;
  depends_on: string[];
  produces: string[];
  body: string;
}

/**
 * Fetches the parsed content of a spec-graph node from the workspace document
 * store (`.swarm/docs`). The spec graph is built from these documents, so node
 * ids resolve here — unlike `/v1/spec/show`, which reads the separate
 * `.swarm/specs` registry and 404s for graph node ids.
 */
export async function getSpecDocument(
  workspaceRoot: string,
  specId: string,
): Promise<SpecGraphDocumentDto> {
  const search = new URLSearchParams();
  search.set("workspace_root", workspaceRoot.trim());
  search.set("spec_id", specId);
  return httpGet<SpecGraphDocumentDto>(`/v1/spec/document?${search.toString()}`);
}
