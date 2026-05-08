import { fetchJson } from "@/shared/api/client";
import type {
  ScenarioArtifactsResponse,
  ScenarioPreview,
  ScenarioPreviewOverrides,
  ScenarioQualityChecksResponse,
  ScenarioSummary,
} from "@/shared/model/scenario-types";

export interface ScenariosListResponse {
  version: number;
  scenarios: ScenarioSummary[];
}

export async function listScenarios(): Promise<ScenariosListResponse> {
  return fetchJson<ScenariosListResponse>("/v1/scenarios");
}

export async function getScenario(id: string): Promise<ScenarioSummary> {
  return fetchJson<ScenarioSummary>(`/v1/scenarios/${encodeURIComponent(id)}`);
}

export async function previewScenario(
  id: string,
  overrides: ScenarioPreviewOverrides = {},
): Promise<ScenarioPreview> {
  const body: Record<string, unknown> = { scenario_id: id };
  if (overrides.pipeline_steps !== undefined) {
    body.pipeline_steps = overrides.pipeline_steps;
  }
  if (overrides.agent_config !== undefined) {
    body.agent_config = overrides.agent_config;
  }
  if (overrides.workspace_write !== undefined) {
    body.workspace_write = overrides.workspace_write;
  }
  if (overrides.skip_gates !== undefined) {
    body.skip_gates = overrides.skip_gates;
  }
  if (overrides.model_profile !== undefined) {
    body.model_profile = overrides.model_profile;
  }
  return fetchJson<ScenarioPreview>("/v1/scenarios/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export interface ScenarioValidateResponse {
  valid: boolean;
  id: string;
  summary: ScenarioSummary;
}

export async function validateScenarioPayload(
  payload: Record<string, unknown>,
): Promise<ScenarioValidateResponse> {
  return fetchJson<ScenarioValidateResponse>("/v1/scenarios/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getScenarioArtifacts(
  taskId: string,
): Promise<ScenarioArtifactsResponse> {
  return fetchJson<ScenarioArtifactsResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/scenario-artifacts`,
  );
}

export async function getScenarioQualityChecks(
  taskId: string,
): Promise<ScenarioQualityChecksResponse> {
  return fetchJson<ScenarioQualityChecksResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/scenario-quality-checks`,
  );
}
