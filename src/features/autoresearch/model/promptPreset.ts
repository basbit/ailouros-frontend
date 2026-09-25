import type { ImproveRolePromptRequest } from "@/shared/api/endpoints/autoresearch";
import { MAX_ITERATION_BUDGET } from "./form";

export const MAX_PROMPT_EVAL_SAMPLES = 20;

export interface PromptPresetFormState {
  role: string;
  goal: string;
  samples: number;
  iterationBudget: number;
  repeats: number;
  minImprovementPct: number;
  judgeModel: string;
}

export function defaultPromptPresetForm(role: string, goal: string): PromptPresetFormState {
  return {
    role,
    goal,
    samples: 2,
    iterationBudget: 10,
    repeats: 1,
    minImprovementPct: 0.5,
    judgeModel: "",
  };
}

function isWholeNumberBetween(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

/** i18n keys of every problem; empty when the preset can be started. */
export function validatePromptPresetForm(
  state: PromptPresetFormState,
  roles: readonly string[],
): string[] {
  const problems: string[] = [];
  if (!roles.includes(state.role)) problems.push("autoresearch.prompt.validation.role");
  if (!state.goal.trim()) problems.push("autoresearch.validation.goal");
  if (!isWholeNumberBetween(state.samples, 1, MAX_PROMPT_EVAL_SAMPLES)) {
    problems.push("autoresearch.prompt.validation.samples");
  }
  if (!isWholeNumberBetween(state.iterationBudget, 1, MAX_ITERATION_BUDGET)) {
    problems.push("autoresearch.validation.iterationBudget");
  }
  if (!isWholeNumberBetween(state.repeats, 1, Number.MAX_SAFE_INTEGER)) {
    problems.push("autoresearch.validation.repeats");
  }
  if (!(state.minImprovementPct >= 0)) problems.push("autoresearch.validation.minImprovement");
  return problems;
}

export function toImproveRolePromptRequest(
  state: PromptPresetFormState,
  agentConfig: Record<string, unknown>,
): ImproveRolePromptRequest {
  return {
    role: state.role,
    goal: state.goal.trim(),
    samples: state.samples,
    iteration_budget: state.iterationBudget,
    repeats: state.repeats,
    min_improvement_pct: state.minImprovementPct,
    judge_model: state.judgeModel.trim(),
    agent_config: agentConfig,
  };
}
