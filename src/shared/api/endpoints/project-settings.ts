import { fetchJson } from "@/shared/api/client";
import type { SettingsSnap } from "@/entities/project/model/types";

interface ProjectSettingsResponse {
  exists: boolean;
  path: string;
  settings: SettingsSnap | null;
}

export async function loadProjectSettings(
  workspaceRoot: string,
): Promise<SettingsSnap | null> {
  const qs = new URLSearchParams({ workspace_root: workspaceRoot });
  const data = await fetchJson<ProjectSettingsResponse>(
    `/v1/project/settings?${qs.toString()}`,
  );
  return data.exists ? data.settings : null;
}

export async function saveProjectSettings(
  workspaceRoot: string,
  settings: SettingsSnap,
): Promise<void> {
  await fetchJson<{ ok: boolean; path: string }>("/v1/project/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workspace_root: workspaceRoot,
      settings,
    }),
  });
}
