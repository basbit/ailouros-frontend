import { httpGet, httpPost } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";
import type {
  ScenarioArtifactsResponse,
  ScenarioEstimate,
  ScenarioPreview,
  ScenarioPreviewOverrides,
  ScenarioQualityChecksResponse,
  ScenarioSummary,
} from "@/shared/model/scenario-types";

type ScenariosListApiResponse =
  paths["/v1/scenarios"]["get"]["responses"][200]["content"]["application/json"];

export type ScenariosListResponse = Omit<ScenariosListApiResponse, "scenarios"> & {
  scenarios: ScenarioSummary[];
};

export async function listScenarios(): Promise<ScenariosListResponse> {
  return httpGet<ScenariosListResponse>("/v1/scenarios");
}

export async function getScenario(id: string): Promise<ScenarioSummary> {
  return httpGet<ScenarioSummary>(`/v1/scenarios/${encodeURIComponent(id)}`);
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
  return httpPost<ScenarioPreview>("/v1/scenarios/preview", body);
}

type ScenarioValidateApiResponse =
  paths["/v1/scenarios/validate"]["post"]["responses"][200]["content"]["application/json"];

export type ScenarioValidateResponse = Omit<
  ScenarioValidateApiResponse,
  "summary"
> & {
  summary: ScenarioSummary;
};

export async function validateScenarioPayload(
  payload: Record<string, unknown>,
): Promise<ScenarioValidateResponse> {
  return httpPost<ScenarioValidateResponse>("/v1/scenarios/validate", payload);
}

export async function getScenarioEstimate(
  scenarioId: string,
): Promise<ScenarioEstimate> {
  return httpGet<ScenarioEstimate>(
    `/v1/scenarios/${encodeURIComponent(scenarioId)}/estimate`,
  );
}

export async function getScenarioArtifacts(
  taskId: string,
): Promise<ScenarioArtifactsResponse> {
  return httpGet<ScenarioArtifactsResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/scenario-artifacts`,
  );
}

export async function getScenarioQualityChecks(
  taskId: string,
): Promise<ScenarioQualityChecksResponse> {
  return httpGet<ScenarioQualityChecksResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/scenario-quality-checks`,
  );
}
