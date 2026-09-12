import { httpGet, httpPut } from "@/shared/api/http";

interface ProjectSettingsResponse<TSettings> {
  exists: boolean;
  path: string;
  settings: TSettings | null;
}

/**
 * Transport for the per-project settings file.
 *
 * The endpoint is deliberately generic over the settings payload: `shared`
 * owns the request/response plumbing, while the shape of a project snapshot is
 * domain knowledge owned by `entities/project`, which supplies the type
 * argument at the call site.
 */
export async function getProjectSettings<TSettings>(
  workspaceRoot: string,
): Promise<TSettings | null> {
  const qs = new URLSearchParams({ workspace_root: workspaceRoot });
  const data = await httpGet<ProjectSettingsResponse<TSettings>>(
    `/v1/project/settings?${qs.toString()}`,
  );
  return data.exists ? data.settings : null;
}

export async function saveProjectSettings<TSettings>(
  workspaceRoot: string,
  settings: TSettings,
): Promise<void> {
  await httpPut<{ ok: boolean; path: string }>("/v1/project/settings", {
    workspace_root: workspaceRoot,
    settings,
  });
}
