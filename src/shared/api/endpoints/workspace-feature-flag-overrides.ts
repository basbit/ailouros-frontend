import { httpGet, httpPut } from "@/shared/api/http";

export interface WorkspaceFeatureFlagOverrides {
  [field: string]: boolean | string;
}

interface WorkspaceOverridesGetResponse {
  exists: boolean;
  path: string;
  overrides: WorkspaceFeatureFlagOverrides;
}

interface WorkspaceOverridesPutResponse {
  ok: boolean;
  path: string;
  applied_env_vars: string[];
}

export async function getWorkspaceFeatureFlagOverrides(
  workspaceRoot: string,
): Promise<WorkspaceFeatureFlagOverrides> {
  const qs = new URLSearchParams({ workspace_root: workspaceRoot });
  const response = await httpGet<WorkspaceOverridesGetResponse>(
    `/v1/workspace/feature-flag-overrides?${qs.toString()}`,
  );
  return response.exists ? response.overrides : {};
}

export async function saveWorkspaceFeatureFlagOverrides(
  workspaceRoot: string,
  overrides: WorkspaceFeatureFlagOverrides,
): Promise<WorkspaceOverridesPutResponse> {
  return httpPut<WorkspaceOverridesPutResponse>(
    "/v1/workspace/feature-flag-overrides",
    { workspace_root: workspaceRoot, overrides },
  );
}
