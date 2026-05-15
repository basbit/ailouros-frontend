import { httpGet, httpPost } from "@/shared/api/http";

export interface DesktopInfo {
  is_desktop: boolean;
  workspaces_dir: string | null;
}

export interface DesktopProjectInit {
  workspace_root: string;
}

export async function getDesktopInfo(signal?: AbortSignal): Promise<DesktopInfo> {
  return httpGet<DesktopInfo>("/v1/desktop/info", { signal });
}

export async function initDesktopProject(
  projectId: string,
  signal?: AbortSignal,
): Promise<DesktopProjectInit> {
  return httpPost<DesktopProjectInit>(
    "/v1/desktop/projects/init",
    { project_id: projectId },
    { signal },
  );
}
