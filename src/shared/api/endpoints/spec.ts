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

interface SpecDriftStaleEntry {
  spec_id?: string;
  path?: string;
  reason?: string;
}

interface SpecDriftAgedKeepRegion {
  path?: string;
  line?: number;
  age_days?: number;
}

export interface SpecDriftReport {
  stale_code: SpecDriftStaleEntry[];
  stale_specs: SpecDriftStaleEntry[];
  aged_keep_regions: SpecDriftAgedKeepRegion[];
}

export interface SpecCodegenOutcome {
  spec_id: string;
  written_files: string[];
  sidecar_paths: string[];
  retry_count: number;
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

export async function getSpecDrift(workspaceRoot = ""): Promise<SpecDriftReport> {
  const qs = buildWorkspaceQuery(workspaceRoot);
  return httpGet<SpecDriftReport>(`/v1/spec/drift${qs}`);
}

export async function generateFromSpec(specId: string): Promise<SpecCodegenOutcome> {
  return httpPost<SpecCodegenOutcome>(
    `/v1/spec/${encodeURIComponent(specId)}/generate`,
  );
}
