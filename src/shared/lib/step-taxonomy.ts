export type NodeType =
  | "agent"
  | "reviewer"
  | "verification"
  | "human_gate"
  | "tool_preflight"
  | "join_branch";

const NODE_TYPE_EXCEPTIONS: Readonly<Record<string, NodeType>> = {
  media_generator: "tool_preflight",
  analyze_code: "tool_preflight",
  stack_review: "reviewer",
  visual_design_review: "reviewer",
  verification_layer: "verification",
  visual_probe: "verification",
  finalize_pipeline: "verification",
  spec_merge: "join_branch",
};

export function classifyStep(stepId: string): NodeType {
  const exception = NODE_TYPE_EXCEPTIONS[stepId];
  if (exception) return exception;
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
