/**
 * Pipeline step taxonomy — the single source of truth for classifying a
 * step id into a node type (agent / reviewer / human_gate / …).
 *
 * Kept separate from StepCard.vue so:
 *   * the breakdown widget can count reviewers/human_gates without
 *     depending on a Vue component,
 *   * regression tests can assert classification rules without mounting DOM,
 *   * the backend is free to send any step id — the UI still renders.
 *
 * Review-rules §10.6 (UI↔Backend contract integrity): when the wire
 * carries `review_pm` in `pipeline_steps` but the user thinks it isn't
 * there, the breakdown widget lets them see the disconnect at a glance.
 */

export type NodeType =
  | "agent"
  | "reviewer"
  | "verification"
  | "human_gate"
  | "tool_preflight"
  | "join_branch";

/** Exact id → node type. Prefix fallback below picks up unknown ids. */
const NODE_TYPE_MAP: Readonly<Record<string, NodeType>> = {
  // Agents (do the work)
  pm: "agent",
  ba: "agent",
  architect: "agent",
  code_quality_architect: "agent",
  arch: "agent",
  devops: "agent",
  dev_lead: "agent",
  dev: "agent",
  qa: "agent",
  dev_subtasks: "agent",
  clarify_input: "agent",
  deep_planning: "agent",
  custom: "agent",
  generate_documentation: "agent",
  refactor_plan: "agent",
  problem_spotter: "agent",
  ux_researcher: "agent",
  ux_architect: "agent",
  ui_designer: "agent",
  image_generator: "agent",
  audio_generator: "agent",
  seo_specialist: "agent",
  ai_citation_strategist: "agent",
  app_store_optimizer: "agent",
  ba_arch_debate: "agent",
  // Reviewers
  review_pm: "reviewer",
  review_ba: "reviewer",
  review_arch: "reviewer",
  review_stack: "reviewer",
  review_spec: "reviewer",
  review_devops: "reviewer",
  review_dev_lead: "reviewer",
  review_dev: "reviewer",
  review_qa: "reviewer",
  review_ux_researcher: "reviewer",
  review_ux_architect: "reviewer",
  review_ui_designer: "reviewer",
  review_seo_specialist: "reviewer",
  review_ai_citation_strategist: "reviewer",
  review_app_store_optimizer: "reviewer",
  stack_review: "reviewer",
  // Verification
  verification_layer: "verification",
  dev_retry_gate: "verification",
  qa_retry_gate: "verification",
  finalize_pipeline: "verification",
  // Human gates
  human_pm: "human_gate",
  human_ba: "human_gate",
  human_arch: "human_gate",
  human_devops: "human_gate",
  human_dev_lead: "human_gate",
  human_dev: "human_gate",
  human_qa: "human_gate",
  human_code_review: "human_gate",
  human_clarify_input: "human_gate",
  human_spec: "human_gate",
  human_ux_researcher: "human_gate",
  human_ux_architect: "human_gate",
  human_ui_designer: "human_gate",
  human_seo_specialist: "human_gate",
  human_ai_citation_strategist: "human_gate",
  human_app_store_optimizer: "human_gate",
  // Tools / join
  analyze_code: "tool_preflight",
  spec_merge: "join_branch",
};

export function classifyStep(stepId: string): NodeType {
  if (NODE_TYPE_MAP[stepId]) return NODE_TYPE_MAP[stepId];
  if (stepId.startsWith("human_")) return "human_gate";
  if (stepId.startsWith("review_")) return "reviewer";
  if (
    stepId.includes("verify") ||
    stepId.includes("gate") ||
    stepId.includes("check")
  ) {
    return "verification";
  }
  return "agent";
}

/** @internal — type contract for `summarizeSteps`, not imported by other modules. */
export interface StepBreakdown {
  total: number;
  agent: number;
  reviewer: number;
  human_gate: number;
  verification: number;
  tool_preflight: number;
  join_branch: number;
}

export function summarizeSteps(stepIds: ReadonlyArray<string>): StepBreakdown {
  const out: StepBreakdown = {
    total: stepIds.length,
    agent: 0,
    reviewer: 0,
    human_gate: 0,
    verification: 0,
    tool_preflight: 0,
    join_branch: 0,
  };
  for (const id of stepIds) {
    out[classifyStep(id)] += 1;
  }
  return out;
}
