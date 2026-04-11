/** Pipeline and role metadata shared by the frontend. */

export const ROLES = [
  "pm",
  "ba",
  "architect",
  "reviewer",
  "stack_reviewer",
  "dev",
  "qa",
  "problem_spotter",
  "refactor_plan",
  "code_diagram",
  "doc_generate",
  "devops",
  "dev_lead",
] as const;

export type RoleId = (typeof ROLES)[number];

export const PIPELINE_OPTIONS_BASE: [string, string][] = [
  ["clarify_input", "Clarify input"],
  ["human_clarify_input", "Human clarify"],
  ["pm", "PM"],
  ["review_pm", "Rev PM"],
  ["human_pm", "Human PM"],
  ["ba", "BA"],
  ["review_ba", "Rev BA"],
  ["human_ba", "Human BA"],
  ["architect", "Architect"],
  ["review_stack", "Rev stack"],
  ["review_arch", "Rev arch"],
  ["human_arch", "Human arch"],
  ["ba_arch_debate", "BA↔Arch debate"],
  ["spec_merge", "Spec merge"],
  ["review_spec", "Rev spec"],
  ["human_spec", "Human spec"],
  ["analyze_code", "Analyze code"],
  ["generate_documentation", "Docs + Mermaid"],
  ["problem_spotter", "Problem spotter"],
  ["refactor_plan", "Refactor plan"],
  ["human_code_review", "Human code review"],
  ["devops", "DevOps"],
  ["review_devops", "Rev DevOps"],
  ["human_devops", "Human DevOps"],
  ["dev_lead", "Dev Lead"],
  ["review_dev_lead", "Rev Dev Lead"],
  ["human_dev_lead", "Human Dev Lead"],
  ["dev", "Dev"],
  ["review_dev", "Rev dev"],
  ["human_dev", "Human dev"],
  ["qa", "QA"],
  ["review_qa", "Rev QA"],
  ["human_qa", "Human QA"],
];

export const PIPELINE_DEFAULT_ORDER = PIPELINE_OPTIONS_BASE.map((x) => x[0]);

const PIPELINE_STEP_LABEL = Object.fromEntries(PIPELINE_OPTIONS_BASE) as Record<
  string,
  string
>;

export const REVIEWER_PIPELINE_STEP_IDS: readonly string[] = [
  "clarify_input",
  "review_pm",
  "review_ba",
  "review_arch",
  "review_spec",
  "review_devops",
  "review_dev",
  "review_dev_lead",
  "review_qa",
  "ba_arch_debate",
];

export interface AgentModelRowMeta {
  configKey: RoleId;
  label: string;
  pipelineStepsHint: string;
  docSubgroup?: "generate_documentation";
}

export const AGENT_MODEL_ROWS_PIPELINE_ORDER: readonly AgentModelRowMeta[] = [
  {
    configKey: "reviewer",
    label: "Clarify + Reviews + BA↔Arch debate",
    pipelineStepsHint: REVIEWER_PIPELINE_STEP_IDS.join(", "),
  },
  { configKey: "pm", label: PIPELINE_STEP_LABEL.pm, pipelineStepsHint: "pm" },
  { configKey: "ba", label: PIPELINE_STEP_LABEL.ba, pipelineStepsHint: "ba" },
  {
    configKey: "stack_reviewer",
    label: PIPELINE_STEP_LABEL.review_stack,
    pipelineStepsHint: "review_stack",
  },
  {
    configKey: "architect",
    label: PIPELINE_STEP_LABEL.architect,
    pipelineStepsHint: "architect",
  },
  {
    configKey: "code_diagram",
    label: `${PIPELINE_STEP_LABEL.generate_documentation} — Mermaid`,
    pipelineStepsHint: "generate_documentation → code_diagram",
    docSubgroup: "generate_documentation",
  },
  {
    configKey: "doc_generate",
    label: `${PIPELINE_STEP_LABEL.generate_documentation} — prose`,
    pipelineStepsHint: "generate_documentation → doc_generate",
  },
  {
    configKey: "problem_spotter",
    label: PIPELINE_STEP_LABEL.problem_spotter,
    pipelineStepsHint: "problem_spotter",
  },
  {
    configKey: "refactor_plan",
    label: PIPELINE_STEP_LABEL.refactor_plan,
    pipelineStepsHint: "refactor_plan",
  },
  {
    configKey: "devops",
    label: PIPELINE_STEP_LABEL.devops,
    pipelineStepsHint: "devops",
  },
  {
    configKey: "dev_lead",
    label: PIPELINE_STEP_LABEL.dev_lead,
    pipelineStepsHint: "dev_lead",
  },
  { configKey: "dev", label: PIPELINE_STEP_LABEL.dev, pipelineStepsHint: "dev" },
  { configKey: "qa", label: PIPELINE_STEP_LABEL.qa, pipelineStepsHint: "qa" },
];

export function splitAgentModelRowsAroundDevSlot(): {
  beforeDevSlot: readonly AgentModelRowMeta[];
  fromDevOnwards: readonly AgentModelRowMeta[];
} {
  const rows = AGENT_MODEL_ROWS_PIPELINE_ORDER;
  const index = rows.findIndex((r) => r.configKey === "dev");
  if (index < 0) {
    return { beforeDevSlot: rows, fromDevOnwards: [] };
  }
  return { beforeDevSlot: rows.slice(0, index), fromDevOnwards: rows.slice(index) };
}

export const ROLE_NEEDS_TOOL_CALLING: Partial<Record<RoleId, boolean>> = {
  pm: true,
  architect: true,
  problem_spotter: true,
  refactor_plan: true,
  devops: true,
};

export const ROLE_MODEL_HINT: Partial<Record<RoleId, string>> = {
  pm: "Requires tool calling support. Suggested: qwen3-coder:30b / claude / gpt-4o",
  ba: "Requirements analysis. Suggested: qwen2.5:14b+ / claude-haiku",
  architect: "Requires tool calling support. Suggested: qwen2.5-coder:14b+ / claude",
  reviewer: "Review and debate. Suggested: any strong reasoning 7b+ model",
  stack_reviewer: "Stack analysis. Suggested: 7b+ is enough",
  dev: "Code generation. Suggested: qwen2.5-coder / deepseek-coder / claude",
  qa: "Test plans and code. Suggested: qwen2.5-coder:7b+ / claude-haiku",
  problem_spotter: "Requires tool calling support. Suggested: qwen2.5:14b+ / claude",
  refactor_plan: "Requires tool calling support. Suggested: qwen2.5:14b+ / deepseek-r1",
  devops: "Requires tool calling support. CI/CD. Suggested: qwen2.5-coder / claude",
  dev_lead: "Task planning. Suggested: qwen3-coder:30b / claude-sonnet",
};
