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

export interface ScenarioSummary {
  id: string;
  title: string;
  category: ScenarioCategory;
  description: string;
  pipeline_steps: string[];
  default_gates: string[];
  expected_artifacts: string[];
  required_tools: string[];
  workspace_write_default: boolean;
  recommended_models: Record<string, string>;
  tags: string[];
  quality_checks: QualityCheckSpec[];
  inputs: ScenarioInputSpec[];
}

export interface ScenarioPreview {
  scenario: ScenarioSummary;
  pipeline_steps: string[];
  default_gates: string[];
  expected_artifacts: string[];
  required_tools: string[];
  recommended_models: Record<string, string>;
  agent_config: Record<string, unknown>;
  workspace_write: boolean;
  warnings: string[];
  skipped_gates: string[];
  model_profile_applied: Record<string, string>;
}

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

interface StepEstimate {
  step_id: string;
  estimated_duration_sec: number | null;
  essential: boolean;
}

export interface ScenarioEstimate {
  scenario_id: string;
  steps: StepEstimate[];
  total_seconds: number | null;
  essential_seconds: number | null;
}

export interface ScenarioQualityChecksResponse {
  task_id: string;
  scenario_id: string | null;
  scenario_title: string | null;
  scenario_category: ScenarioCategory | null;
  specs: QualityCheckSpec[];
  results: QualityCheckResult[];
  summary: QualityCheckSummary;
}
