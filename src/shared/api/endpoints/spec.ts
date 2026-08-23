import { httpGet, httpPost } from "@/shared/api/http";

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

export interface SpecAncestorsDto {
  spec_id: string;
  depth: number;
  ancestors: string[];
}

export interface SpecDependantsDto {
  spec_id: string;
  depth: number;
  dependants: string[];
}

export interface SpecOrphansDto {
  anchor: string;
  orphans: string[];
}

/** Encodes a `:path`-style spec id so embedded slashes survive the route. */
function encodeSpecPath(specId: string): string {
  return specId.split("/").map(encodeURIComponent).join("/");
}

function buildGraphQuery(workspaceRoot: string, depth?: number): string {
  const search = new URLSearchParams();
  if (workspaceRoot.trim()) {
    search.set("workspace_root", workspaceRoot.trim());
  }
  if (typeof depth === "number" && depth >= 1) {
    search.set("depth", String(depth));
  }
  return search.size ? `?${search.toString()}` : "";
}

export async function getSpecAncestors(
  workspaceRoot: string,
  specId: string,
  depth = 1,
): Promise<SpecAncestorsDto> {
  const qs = buildGraphQuery(workspaceRoot, depth);
  return httpGet<SpecAncestorsDto>(`/v1/spec/${encodeSpecPath(specId)}/ancestors${qs}`);
}

export async function getSpecDependants(
  workspaceRoot: string,
  specId: string,
  depth = 1,
): Promise<SpecDependantsDto> {
  const qs = buildGraphQuery(workspaceRoot, depth);
  return httpGet<SpecDependantsDto>(
    `/v1/spec/${encodeSpecPath(specId)}/dependants${qs}`,
  );
}

export async function getSpecOrphans(
  workspaceRoot: string,
  anchor = "_project",
): Promise<SpecOrphansDto> {
  const search = new URLSearchParams();
  if (workspaceRoot.trim()) {
    search.set("workspace_root", workspaceRoot.trim());
  }
  search.set("anchor", anchor);
  return httpGet<SpecOrphansDto>(`/v1/spec/orphans?${search.toString()}`);
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

export interface SpecInitRequestDto {
  workspace_root: string;
  project_title?: string;
  project_summary?: string;
  initial_module_spec_id?: string | null;
  initial_module_title?: string;
}

export interface SpecInitDto {
  workspace_root: string;
  specs_root: string;
  created_spec_ids: string[];
  bootstrapped: boolean;
}

export interface SpecListDto {
  spec_ids: string[];
}

/**
 * Bootstraps `.swarm/specs` for a workspace. Local-caller guarded, so it is
 * only meaningful when the UI runs on the same host as the backend.
 */
export async function getSpecInit(request: SpecInitRequestDto): Promise<SpecInitDto> {
  return httpPost<SpecInitDto>("/v1/spec/init", request);
}

export async function getSpecList(workspaceRoot: string): Promise<SpecListDto> {
  const search = new URLSearchParams();
  search.set("workspace_root", workspaceRoot.trim());
  return httpGet<SpecListDto>(`/v1/spec/list?${search.toString()}`);
}
