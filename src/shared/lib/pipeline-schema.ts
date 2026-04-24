/** Pipeline and role metadata shared by the frontend. */

export const ROLES = [
  "pm",
  "ba",
  "architect",
  "code_quality_architect",
  "reviewer",
  "stack_reviewer",
  "ux_researcher",
  "ux_architect",
  "ui_designer",
  "image_generator",
  "audio_generator",
  "dev",
  "qa",
  "problem_spotter",
  "refactor_plan",
  "code_diagram",
  "doc_generate",
  "devops",
  "dev_lead",
  "seo_specialist",
  "ai_citation_strategist",
  "app_store_optimizer",
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
  ["code_quality_architect", "Code Quality"],
  ["ux_researcher", "UX Researcher"],
  ["review_ux_researcher", "Rev UX Research"],
  ["human_ux_researcher", "Human UX Research"],
  ["ux_architect", "UX Architect"],
  ["review_ux_architect", "Rev UX Arch"],
  ["human_ux_architect", "Human UX Arch"],
  ["ui_designer", "UI Designer"],
  ["review_ui_designer", "Rev UI Design"],
  ["human_ui_designer", "Human UI Design"],
  ["image_generator", "Image Generator"],
  ["audio_generator", "Audio Generator"],
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
  ["seo_specialist", "SEO Specialist"],
  ["review_seo_specialist", "Rev SEO"],
  ["human_seo_specialist", "Human SEO"],
  ["ai_citation_strategist", "AI Citation"],
  ["review_ai_citation_strategist", "Rev AI Citation"],
  ["human_ai_citation_strategist", "Human AI Citation"],
  ["app_store_optimizer", "App Store Opt"],
  ["review_app_store_optimizer", "Rev ASO"],
  ["human_app_store_optimizer", "Human ASO"],
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
  "review_ux_researcher",
  "review_ux_architect",
  "review_ui_designer",
  "review_devops",
  "review_dev",
  "review_dev_lead",
  "review_qa",
  "review_seo_specialist",
  "review_ai_citation_strategist",
  "review_app_store_optimizer",
  "ba_arch_debate",
];

export interface AgentModelRowMeta {
  configKey: RoleId;
  label: string;
  pipelineStepsHint: string;
  docSubgroup?: "generate_documentation";
}

/**
 * Overrides for roles that need non-default labels, hints, or subgroups
 * in the Agent Models UI. Roles not listed here use automatic defaults:
 *   { configKey: role, label: PIPELINE_STEP_LABEL[role], pipelineStepsHint: role }
 */
const _AGENT_MODEL_ROW_OVERRIDES: Partial<Record<RoleId, Partial<AgentModelRowMeta>>> =
  {
    reviewer: {
      label: "Clarify + Reviews + BA↔Arch debate",
      pipelineStepsHint: REVIEWER_PIPELINE_STEP_IDS.join(", "),
    },
    stack_reviewer: {
      label: PIPELINE_STEP_LABEL.review_stack,
      pipelineStepsHint: "review_stack",
    },
    code_quality_architect: {
      label: "Code Quality Architect",
      pipelineStepsHint: "architecture and code quality guardrails",
    },
    image_generator: {
      label: "Image Generator",
      pipelineStepsHint: "media.image generation planning",
    },
    audio_generator: {
      label: "Audio Generator",
      pipelineStepsHint: "media.audio generation planning",
    },
    code_diagram: {
      label: `${PIPELINE_STEP_LABEL.generate_documentation} — Mermaid`,
      pipelineStepsHint: "generate_documentation → code_diagram",
      docSubgroup: "generate_documentation",
    },
    doc_generate: {
      label: `${PIPELINE_STEP_LABEL.generate_documentation} — prose`,
      pipelineStepsHint: "generate_documentation → doc_generate",
    },
  };

export const AGENT_MODEL_ROWS_PIPELINE_ORDER: readonly AgentModelRowMeta[] = ROLES.map(
  (role): AgentModelRowMeta => {
    const overrides = _AGENT_MODEL_ROW_OVERRIDES[role];
    return {
      configKey: role,
      label: overrides?.label ?? PIPELINE_STEP_LABEL[role] ?? role,
      pipelineStepsHint: overrides?.pipelineStepsHint ?? role,
      ...(overrides?.docSubgroup ? { docSubgroup: overrides.docSubgroup } : {}),
    };
  },
);

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
  code_quality_architect:
    "Architecture governance and code quality. Suggested: qwen2.5-coder:14b+ / claude",
  reviewer: "Review and debate. Suggested: any strong reasoning 7b+ model",
  stack_reviewer: "Stack analysis. Suggested: 7b+ is enough",
  dev: "Code generation. Suggested: qwen2.5-coder / deepseek-coder / claude",
  qa: "Test plans and code. Suggested: qwen2.5-coder:7b+ / claude-haiku",
  problem_spotter: "Requires tool calling support. Suggested: qwen2.5:14b+ / claude",
  refactor_plan: "Requires tool calling support. Suggested: qwen2.5:14b+ / deepseek-r1",
  devops: "Requires tool calling support. CI/CD. Suggested: qwen2.5-coder / claude",
  dev_lead: "Task planning. Suggested: qwen3-coder:30b / claude-sonnet",
  ux_researcher: "User research & personas. Suggested: qwen2.5:14b+ / claude",
  ux_architect: "UX architecture & CSS systems. Suggested: qwen2.5-coder:14b+ / claude",
  ui_designer: "Visual design & components. Suggested: qwen2.5:14b+ / claude",
  image_generator:
    "Image generation prompts and specs. Suggested: multimodal-capable cloud model",
  audio_generator:
    "Audio/TTS generation prompts and specs. Suggested: strong creative writing model",
  seo_specialist: "SEO strategy & technical audit. Suggested: qwen2.5:14b+ / claude",
  ai_citation_strategist: "AI citation & AEO/GEO. Suggested: qwen2.5:14b+ / claude",
  app_store_optimizer:
    "ASO & conversion optimization. Suggested: qwen2.5:14b+ / claude",
};
