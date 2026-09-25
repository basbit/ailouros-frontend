import type { CreateResearchSessionRequest } from "@/shared/api/endpoints/autoresearch";

export type MetricParseKind = "last_number" | "regex" | "json";

export interface AutoresearchFormState {
  workspaceRoot: string;
  goal: string;
  metricCommand: string;
  metricParseKind: MetricParseKind;
  metricParseArgument: string;
  direction: "min" | "max";
  repeats: number;
  minImprovementPct: number;
  guardCommand: string;
  mutablePaths: string;
  iterationBudget: number;
  iterationTimeoutSec: number;
  maxConsecutiveErrors: number;
  targetValue: string;
}

export const MAX_ITERATION_BUDGET = 200;

export function defaultAutoresearchForm(workspaceRoot = ""): AutoresearchFormState {
  return {
    workspaceRoot,
    goal: "",
    metricCommand: "",
    metricParseKind: "last_number",
    metricParseArgument: "",
    direction: "min",
    repeats: 3,
    minImprovementPct: 0.5,
    guardCommand: "",
    mutablePaths: "",
    iterationBudget: 20,
    iterationTimeoutSec: 600,
    maxConsecutiveErrors: 3,
    targetValue: "",
  };
}

export function splitMutablePaths(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isWholeNumberAtLeast(value: number, minimum: number): boolean {
  return Number.isInteger(value) && value >= minimum;
}

/** i18n keys of every problem; empty when the form can be submitted. */
export function validateAutoresearchForm(state: AutoresearchFormState): string[] {
  const problems: string[] = [];
  if (!state.workspaceRoot.trim())
    problems.push("autoresearch.validation.workspaceRoot");
  if (!state.goal.trim()) problems.push("autoresearch.validation.goal");
  if (!state.metricCommand.trim())
    problems.push("autoresearch.validation.metricCommand");
  if (state.metricParseKind !== "last_number" && !state.metricParseArgument.trim()) {
    problems.push("autoresearch.validation.metricParseArgument");
  }
  if (!splitMutablePaths(state.mutablePaths).length) {
    problems.push("autoresearch.validation.mutablePaths");
  }
  if (!isWholeNumberAtLeast(state.repeats, 1))
    problems.push("autoresearch.validation.repeats");
  if (
    !isWholeNumberAtLeast(state.iterationBudget, 1) ||
    state.iterationBudget > MAX_ITERATION_BUDGET
  ) {
    problems.push("autoresearch.validation.iterationBudget");
  }
  if (!(state.minImprovementPct >= 0))
    problems.push("autoresearch.validation.minImprovement");
  if (!isWholeNumberAtLeast(state.iterationTimeoutSec, 1)) {
    problems.push("autoresearch.validation.iterationTimeout");
  }
  if (!isWholeNumberAtLeast(state.maxConsecutiveErrors, 1)) {
    problems.push("autoresearch.validation.maxConsecutiveErrors");
  }
  if (state.targetValue.trim() && !Number.isFinite(Number(state.targetValue))) {
    problems.push("autoresearch.validation.targetValue");
  }
  return problems;
}

function metricParseText(state: AutoresearchFormState): string {
  if (state.metricParseKind === "last_number") return "last_number";
  return `${state.metricParseKind}:${state.metricParseArgument.trim()}`;
}

export function toCreateRequest(
  state: AutoresearchFormState,
  agentConfig: Record<string, unknown>,
): CreateResearchSessionRequest {
  const target = state.targetValue.trim();
  return {
    workspace_root: state.workspaceRoot.trim(),
    goal: state.goal.trim(),
    metric_command: state.metricCommand.trim(),
    metric_parse: metricParseText(state),
    direction: state.direction,
    repeats: state.repeats,
    min_improvement_pct: state.minImprovementPct,
    guard_command: state.guardCommand.trim(),
    mutable_paths: splitMutablePaths(state.mutablePaths),
    iteration_budget: state.iterationBudget,
    iteration_timeout_sec: state.iterationTimeoutSec,
    max_consecutive_errors: state.maxConsecutiveErrors,
    target_value: target ? Number(target) : null,
    agent_config: agentConfig,
  };
}
