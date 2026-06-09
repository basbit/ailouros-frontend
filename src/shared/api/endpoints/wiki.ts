import { httpGet, httpGetText } from "@/shared/api/http";

interface WikiGraphNodeDto {
  id: string;
  title: string;
  tags: string[];
  color: string;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface WikiGraphEdgeDto {
  id: string;
  source: string | WikiGraphNodeDto;
  target: string | WikiGraphNodeDto;
}

export interface WikiGraphDto {
  nodes?: WikiGraphNodeDto[];
  edges?: WikiGraphEdgeDto[];
}

export async function getWikiFileContent(
  path: string,
  workspaceRoot?: string,
): Promise<string> {
  const params = new URLSearchParams({ path });
  if (workspaceRoot?.trim()) {
    params.set("workspace_root", workspaceRoot.trim());
  }
  return httpGetText(`/v1/wiki/file?${params.toString()}`);
}

export async function getWikiGraph(
  workspaceRoot = "",
  force = false,
): Promise<WikiGraphDto> {
  const search = new URLSearchParams();
  if (workspaceRoot.trim()) {
    search.set("workspace_root", workspaceRoot.trim());
  }
  if (force) {
    search.set("force", "true");
  }
  const path = search.size ? `/v1/wiki/graph?${search.toString()}` : "/v1/wiki/graph";
  return httpGet<WikiGraphDto>(path);
}
