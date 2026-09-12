import { httpGet, httpPost } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";

export type DesktopInfo =
  paths["/v1/desktop/info"]["get"]["responses"][200]["content"]["application/json"];

export type DesktopProjectInit =
  paths["/v1/desktop/projects/init"]["post"]["responses"][200]["content"]["application/json"];

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
