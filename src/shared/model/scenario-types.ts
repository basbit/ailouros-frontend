import type { components } from "@/shared/api/openapi-types";

export type ScenarioCategory =
  | "development"
  | "research"
  | "code_quality"
  | "content"
  | "data"
  | "product"
  | "support"
  | "visual_qa"
  | "seo"
  | "custom";

type QualityCheckSeverity = "error" | "warning" | "info";

interface QualityCheckSpec {
  id: string;
  type: string;
  severity: QualityCheckSeverity;
  blocking: boolean;
  config: Record<string, unknown>;
}

interface QualityCheckResult {
  id: string;
  type: string;
  passed: boolean;
  severity: QualityCheckSeverity;
  blocking: boolean;
  message: string;
  detail?: Record<string, unknown>;
}

interface QualityCheckSummary {
  total: number;
  passed: number;
  failed: number;
  blocking_failed: string[];
}

export type ScenarioInputKey =
  | "prompt"
  | "workspace_root"
  | "project_context_file"
  | "workspace_write";

export interface ScenarioInputSpec {
  key: ScenarioInputKey;
  label: string;
  hint: string;
  required: boolean;
}

/**
 * Backed by the generated `ScenarioSummaryResponse` (see `GET /v1/scenarios`),
 * so a backend field rename is a compile error here. Three fields are narrowed
 * beyond what OpenAPI can express: `category` is a closed union, and
 * `quality_checks` / `inputs` are typed objects rather than free-form dicts.
 * `topology` / `auto_project_docs` are optional so existing literals still
 * satisfy the type.
 */
export type ScenarioSummary = Omit<
  components["schemas"]["ScenarioSummaryResponse"],
  "category" | "quality_checks" | "inputs" | "topology" | "auto_project_docs"
> & {
  category: ScenarioCategory;
  quality_checks: QualityCheckSpec[];
  inputs: ScenarioInputSpec[];
  topology?: string;
  auto_project_docs?: string[];
};

export type ScenarioPreview = Omit<
  components["schemas"]["ScenarioPreviewResponse"],
  "scenario"
> & {
  scenario: ScenarioSummary;
};

export interface ScenarioPreviewOverrides {
  pipeline_steps?: string[];
  agent_config?: Record<string, unknown>;
  workspace_write?: boolean;
  skip_gates?: string[];
  model_profile?: Record<string, string>;
}

export interface ScenarioProjectOverride {
  skip_gates?: string[];
  model_profile?: Record<string, string>;
}

interface ScenarioArtifactEntry {
  path: string;
  present: boolean;
  size: number | null;
  mtime: number | null;
  url: string | null;
}

interface ScenarioArtifactSummary {
  present: number;
  missing: number;
  total: number;
}

export interface ScenarioArtifactsResponse {
  task_id: string;
  scenario_id: string | null;
  scenario_title: string | null;
  scenario_category: ScenarioCategory | null;
  expected_artifacts: string[];
  status: ScenarioArtifactEntry[];
  summary: ScenarioArtifactSummary;
}

export type ScenarioEstimate =
  components["schemas"]["ScenarioEstimateResponse"];

export interface ScenarioQualityChecksResponse {
  task_id: string;
  scenario_id: string | null;
  scenario_title: string | null;
  scenario_category: ScenarioCategory | null;
  specs: QualityCheckSpec[];
  results: QualityCheckResult[];
  summary: QualityCheckSummary;
}
