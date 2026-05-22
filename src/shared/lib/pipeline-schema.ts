import {
  getCachedRolesCatalog,
  onRolesCatalogUpdate,
} from "@/shared/api/endpoints/rolesCatalog";

export type RoleId = string;

interface PipelineStepPlanEntry {
  id: string;
  role_ref?: string;
  label?: string;
}

function _pipelineStepPlan(): readonly PipelineStepPlanEntry[] {
  const catalog = getCachedRolesCatalog() as {
    pipeline_step_plan?: PipelineStepPlanEntry[];
  };
  if (Array.isArray(catalog.pipeline_step_plan)) {
    return catalog.pipeline_step_plan;
  }
  return [];
}

function _roleLabel(roleId: string): string {
  const catalog = getCachedRolesCatalog();
  const entry = catalog.roles.find((r) => r.id === roleId);
  return entry?.label ?? roleId;
}

function buildPipelineOptionsBase(): [string, string][] {
  return _pipelineStepPlan().map((step) => {
    if (step.role_ref) {
      return [step.id, _roleLabel(step.role_ref)] as [string, string];
    }
    return [step.id, step.label ?? step.id] as [string, string];
  });
}

function _pipelineStepLabel(): Record<string, string> {
  return Object.fromEntries(buildPipelineOptionsBase());
}

export const PIPELINE_OPTIONS_BASE: [string, string][] = buildPipelineOptionsBase();

export const PIPELINE_DEFAULT_ORDER: string[] = _pipelineStepPlan().map((s) => s.id);

function getRoleIds(): readonly string[] {
  return getCachedRolesCatalog().roles.map((r) => r.id);
}

const _ROLES_STATE: RoleId[] = getCachedRolesCatalog().roles.map((r) => r.id);

export const ROLES: readonly RoleId[] = _ROLES_STATE;

onRolesCatalogUpdate(() => {
  const freshOptions = buildPipelineOptionsBase();
  PIPELINE_OPTIONS_BASE.length = 0;
  for (const pair of freshOptions) {
    PIPELINE_OPTIONS_BASE.push(pair);
  }
  const freshOrder = _pipelineStepPlan().map((s) => s.id);
  PIPELINE_DEFAULT_ORDER.length = 0;
  for (const id of freshOrder) {
    PIPELINE_DEFAULT_ORDER.push(id);
  }
  _ROLES_STATE.length = 0;
  for (const role of getCachedRolesCatalog().roles) {
    _ROLES_STATE.push(role.id);
  }
});

const REVIEWER_PIPELINE_STEP_IDS: readonly string[] = [
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
  "visual_design_review",
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

interface AgentModelRowOverride {
  label?: string;
  pipelineStepsHint?: string;
  docSubgroup?: "generate_documentation";
}

function _agentModelRowOverrides(): Record<string, AgentModelRowOverride> {
  const labels = _pipelineStepLabel();
  return {
    reviewer: {
      label: "Clarify + Reviews + BA↔Arch debate",
      pipelineStepsHint: REVIEWER_PIPELINE_STEP_IDS.join(", "),
    },
    stack_reviewer: {
      label: labels.review_stack,
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
      label: `${labels.generate_documentation} — Mermaid`,
      pipelineStepsHint: "generate_documentation → code_diagram",
      docSubgroup: "generate_documentation",
    },
    doc_generate: {
      label: `${labels.generate_documentation} — prose`,
      pipelineStepsHint: "generate_documentation → doc_generate",
    },
  };
}

function buildAgentModelRowsPipelineOrder(): readonly AgentModelRowMeta[] {
  const overrides = _agentModelRowOverrides();
  const labels = _pipelineStepLabel();
  return getRoleIds().map((role): AgentModelRowMeta => {
    const ov = overrides[role];
    return {
      configKey: role,
      label: ov?.label ?? labels[role] ?? role,
      pipelineStepsHint: ov?.pipelineStepsHint ?? role,
      ...(ov?.docSubgroup ? { docSubgroup: ov.docSubgroup } : {}),
    };
  });
}

export function splitAgentModelRowsAroundDevSlot(): {
  beforeDevSlot: readonly AgentModelRowMeta[];
  fromDevOnwards: readonly AgentModelRowMeta[];
} {
  const rows = buildAgentModelRowsPipelineOrder();
  const devSlotId = "dev";
  const index = rows.findIndex((r) => r.configKey === devSlotId);
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
