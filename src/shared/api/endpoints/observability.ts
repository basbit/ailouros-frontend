import { fetchJson } from "@/shared/api/client";

export interface ObservabilityRunSummary {
  task_id: string;
  project: string;
  scenario_id: string | null;
  scenario_title: string | null;
  scenario_category: string | null;
  status: string | null;
  overall_score: number | null;
  artifacts_present: number;
  artifacts_total: number;
  finished_at: number | null;
}

export interface ObservabilitySeries {
  days: string[];
  runs: number[];
  avg_score: Array<number | null>;
}

export interface ObservabilityAggregate {
  total: number;
  by_status: Record<string, number>;
  by_scenario: Record<string, number>;
  by_project: Record<string, number>;
  avg_overall_score: number | null;
  artifacts_present_total: number;
  artifacts_total_total: number;
  series: ObservabilitySeries;
}

export interface ObservabilityResponse {
  summaries: ObservabilityRunSummary[];
  aggregate: ObservabilityAggregate;
}

export async function getCrossProjectObservability(): Promise<ObservabilityResponse> {
  return fetchJson<ObservabilityResponse>("/v1/observability/cross-project");
}
