import type { EffectReport } from "@/shared/api/endpoints/effect-metrics";

export function makeReport(overrides: Partial<EffectReport> = {}): EffectReport {
  return {
    first_day: "2026-09-10",
    last_day: "2026-09-16",
    workspace_root: null,
    runs: {
      total: 3,
      finished: 2,
      completed: 1,
      failed: 1,
      cancelled: 0,
      awaiting_human: 1,
      in_progress: 0,
      success_rate: 0.5,
      status_counts: { completed: 1, failed: 1, awaiting_human: 1 },
      trigger_counts: { ui: 2, unrecorded: 1 },
      per_day: [
        { day: "2026-09-15", total: 1, completed: 1, failed: 0 },
        { day: "2026-09-16", total: 2, completed: 0, failed: 1 },
      ],
    },
    changes: {
      runs_with_file_counts: 1,
      files_changed: 4,
      runs_with_line_counts: 1,
      lines_added: 120,
      lines_removed: 7,
    },
    tokens: {
      runs_with_tokens: 1,
      total_tokens: 5000,
      tokens_per_run: 5000,
      successful_runs_with_tokens: 1,
      tokens_per_successful_run: 5000,
    },
    duration: { runs_with_duration: 2, median_seconds: 95, p90_seconds: 4000 },
    feedback: {
      total: 4,
      accepted: 3,
      rejected: 1,
      edited: 0,
      accept_rate: 0.75,
      reject_rate: 0.25,
      edit_rate: 0,
    },
    research: {
      sessions: 2,
      sessions_with_improvement: 1,
      kept_improvements: 3,
      items: [
        {
          session_id: "s1",
          goal: "faster parser",
          created_at: "2026-09-14T08:00:00Z",
          status: "completed",
          kept_count: 3,
          best_improvement_pct: 18.25,
          pull_request_url: "https://example.test/pr/1",
        },
        {
          session_id: "s2",
          goal: "smaller bundle",
          created_at: "2026-09-13T08:00:00Z",
          status: "completed",
          kept_count: 0,
          best_improvement_pct: null,
          pull_request_url: "",
        },
      ],
    },
    pull_requests: {
      total: 1,
      source_counts: { autoresearch: 1 },
      items: [
        {
          source: "autoresearch",
          url: "https://example.test/pr/1",
          reference: "s1",
          recorded_at: "2026-09-14T08:00:00Z",
        },
      ],
    },
    unreadable_runs: 0,
    source_errors: {},
    ...overrides,
  };
}

/** A period in which no run recorded tokens, lines, files or durations. */
export function makeUnmeasuredReport(): EffectReport {
  const report = makeReport();
  return {
    ...report,
    runs: { ...report.runs, success_rate: null },
    changes: {
      runs_with_file_counts: 0,
      files_changed: null,
      runs_with_line_counts: 0,
      lines_added: null,
      lines_removed: null,
    },
    tokens: {
      runs_with_tokens: 0,
      total_tokens: null,
      tokens_per_run: null,
      successful_runs_with_tokens: 0,
      tokens_per_successful_run: null,
    },
    duration: { runs_with_duration: 0, median_seconds: null, p90_seconds: null },
    feedback: null,
    source_errors: { codegen_feedback: "qdrant down" },
  };
}
