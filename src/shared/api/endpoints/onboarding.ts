import { apiUrl } from "@/shared/api/base";
import { ApiError, fetchJson } from "@/shared/api/client";
import type {
  MCPServerSpec,
  ModelAssignment,
  PreconfigResult,
  PreflightRecommendation,
  ScanResult,
} from "@/shared/model/onboarding-types";

export interface OnboardingModelsResponse {
  source?: string;
  config?: {
    roles?: Record<
      string,
      { model_id?: string; provider?: string; reason?: string; remote_profile?: string }
    >;
  };
  assignments?: ModelAssignment[];
}

export interface OnboardingPreflightResponse {
  servers?: Record<
    string,
    { status: string; latency_ms?: number; tool_count?: number; error?: string }
  >;
  recommended_capabilities?: PreflightRecommendation[];
  recommended_servers?: PreflightRecommendation[];
}

export async function scanOnboardingWorkspace(
  workspaceRoot: string,
): Promise<ScanResult> {
  return fetchJson<ScanResult>(
    `/v1/onboarding/scan?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
}

export async function preconfigureOnboarding(
  workspaceRoot: string,
): Promise<PreconfigResult & { detected_stack?: string[]; error?: string }> {
  return fetchJson<PreconfigResult & { detected_stack?: string[]; error?: string }>(
    "/v1/onboarding/preconfigure",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_root: workspaceRoot }),
    },
  );
}

export async function applyOnboardingConfig(
  workspaceRoot: string,
  content: string,
): Promise<void> {
  await fetchJson<{ status: string; workspace_root: string }>("/v1/onboarding/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_root: workspaceRoot, content }),
  });
}

export async function applyOnboardingMcpConfig(
  workspaceRoot: string,
  servers: MCPServerSpec[],
): Promise<void> {
  await fetchJson<{ status: string; path: string }>("/v1/onboarding/mcp-config/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_root: workspaceRoot, servers }),
  });
}

export async function runOnboardingMcpPreflight(
  workspaceRoot: string,
  searchKeys: Partial<
    Record<"tavily_api_key" | "exa_api_key" | "scrapingdog_api_key", string | undefined>
  >,
): Promise<OnboardingPreflightResponse> {
  return fetchJson<OnboardingPreflightResponse>("/v1/onboarding/mcp-preflight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace_root: workspaceRoot, ...searchKeys }),
  });
}

export async function getOnboardingModels(
  workspaceRoot: string,
): Promise<OnboardingModelsResponse> {
  return fetchJson<OnboardingModelsResponse>(
    `/v1/onboarding/models?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
}

export async function getLiveOnboardingAssignments(
  workspaceRoot: string,
): Promise<ModelAssignment[]> {
  const data = await getOnboardingModels(workspaceRoot);
  if (Array.isArray(data.assignments)) return data.assignments;
  const roles = data.config?.roles ?? {};
  return Object.entries(roles).map(([role, info]) => ({
    role,
    model_id: info.model_id ?? "",
    provider: info.provider ?? "",
    reason: info.reason ?? "",
    remote_profile: info.remote_profile,
  }));
}

export async function startSwarmChatStream(
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(apiUrl("/v1/chat/completions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function getOnboardingAssignmentsOrThrow(
  workspaceRoot: string,
): Promise<ModelAssignment[]> {
  const response = await getOnboardingModels(workspaceRoot);
  const assignments = await getLiveOnboardingAssignments(workspaceRoot);
  if (!assignments.length && response.source === "saved" && !response.config?.roles) {
    throw new ApiError("onboarding models missing assignments", 500);
  }
  return assignments;
}
