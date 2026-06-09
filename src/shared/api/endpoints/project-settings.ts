import { httpGet, httpPut } from "@/shared/api/http";
import type { SettingsSnap } from "@/shared/model/project-types";

interface ProjectSettingsResponse {
  exists: boolean;
  path: string;
  settings: SettingsSnap | null;
}

export async function getProjectSettings(
  workspaceRoot: string,
): Promise<SettingsSnap | null> {
  const qs = new URLSearchParams({ workspace_root: workspaceRoot });
  const data = await httpGet<ProjectSettingsResponse>(
    `/v1/project/settings?${qs.toString()}`,
  );
  return data.exists ? data.settings : null;
}

export async function saveProjectSettings(
  workspaceRoot: string,
  settings: SettingsSnap,
): Promise<void> {
  await httpPut<{ ok: boolean; path: string }>("/v1/project/settings", {
    workspace_root: workspaceRoot,
    settings,
  });
}
