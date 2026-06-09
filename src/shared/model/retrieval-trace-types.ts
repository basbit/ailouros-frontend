interface RetrievalTraceStage {
  name: string;
  started_at: string;
  duration_ms: number;
  details: Record<string, unknown>;
}

export interface RetrievalTraceSummary {
  trace_id: string;
  query: string;
  backend: string;
  started_at: string;
  total_duration_ms: number;
  final_verdict: string;
  stage_count: number;
}

export interface RetrievalTraceDetail extends RetrievalTraceSummary {
  workspace_root: string;
  final_candidate_ids: string[];
  stages: RetrievalTraceStage[];
}
