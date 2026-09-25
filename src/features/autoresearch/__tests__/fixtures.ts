import type {
  ResearchIteration,
  ResearchSession,
} from "@/shared/api/endpoints/autoresearch";

export function makeIteration(
  overrides: Partial<ResearchIteration> = {},
): ResearchIteration {
  return {
    number: 1,
    hypothesis: "cache the parser",
    decision: "kept",
    reason: "improved by 20.000% (100 -> 80)",
    reference_value: 100,
    value: 80,
    improvement_pct: 20,
    commit: "c1",
    changed_files: ["src/parser.ts"],
    input_tokens: 100,
    output_tokens: 20,
    metric_output_tail: "80",
    ...overrides,
  };
}

export function makeSession(overrides: Partial<ResearchSession> = {}): ResearchSession {
  return {
    id: "s1",
    config: {
      workspace_root: "/work/project",
      goal: "faster parser",
      metric_source: "command",
      metric_command: "npm run bench",
      metric_parse: "last_number",
      prompt_eval: null,
      direction: "min",
      mutable_paths: ["src/**"],
      repeats: 3,
      min_improvement_pct: 0.5,
      guard_command: "",
      iteration_budget: 10,
      iteration_timeout_sec: 600,
      max_consecutive_errors: 3,
      target_value: null,
    },
    researcher_model: "model-x",
    status: "running",
    stop_reason: "",
    created_at: "2026-09-24T10:00:00+00:00",
    updated_at: "2026-09-24T10:01:00+00:00",
    branch: "swarm/autoresearch-s1",
    worktree_path: "/work/project/.swarm/worktrees/autoresearch-s1",
    base_commit: "base0",
    base_branch: "main",
    baseline: 100,
    baseline_samples: [100, 101, 99],
    best_value: 80,
    best_commit: "c1",
    best_iteration: 1,
    kept_count: 1,
    iterations: [makeIteration()],
    last_output_tail: "80",
    total_input_tokens: 100,
    total_output_tokens: 20,
    pull_request_url: "",
    applied_files: [],
    discarded: false,
    ...overrides,
  };
}
