import { pipelineStepLabels } from "@/entities/pipeline";
import { currentRoleIds, type RoleId } from "@/entities/role";

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
  const labels = pipelineStepLabels();
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
  const labels = pipelineStepLabels();
  return currentRoleIds().map((role): AgentModelRowMeta => {
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
