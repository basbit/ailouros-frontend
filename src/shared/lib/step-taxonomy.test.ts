import { describe, expect, it } from "vitest";
import { classifyStep, summarizeSteps } from "@/shared/lib/step-taxonomy";

const FULL_TAXONOMY_CONTRACT = [
  ["pm", "agent"],
  ["ba", "agent"],
  ["architect", "agent"],
  ["code_quality_architect", "agent"],
  ["arch", "agent"],
  ["devops", "agent"],
  ["dev_lead", "agent"],
  ["dev", "agent"],
  ["qa", "agent"],
  ["dev_subtasks", "agent"],
  ["clarify_input", "agent"],
  ["deep_planning", "agent"],
  ["custom", "agent"],
  ["generate_documentation", "agent"],
  ["refactor_plan", "agent"],
  ["problem_spotter", "agent"],
  ["ux_researcher", "agent"],
  ["ux_architect", "agent"],
  ["ui_designer", "agent"],
  ["image_generator", "agent"],
  ["audio_generator", "agent"],
  ["media_generator", "tool_preflight"],
  ["seo_specialist", "agent"],
  ["ai_citation_strategist", "agent"],
  ["app_store_optimizer", "agent"],
  ["ba_arch_debate", "agent"],
  ["review_pm", "reviewer"],
  ["review_ba", "reviewer"],
  ["review_arch", "reviewer"],
  ["review_stack", "reviewer"],
  ["review_spec", "reviewer"],
  ["review_devops", "reviewer"],
  ["review_dev_lead", "reviewer"],
  ["review_dev", "reviewer"],
  ["review_qa", "reviewer"],
  ["review_ux_researcher", "reviewer"],
  ["review_ux_architect", "reviewer"],
  ["review_ui_designer", "reviewer"],
  ["review_seo_specialist", "reviewer"],
  ["review_ai_citation_strategist", "reviewer"],
  ["review_app_store_optimizer", "reviewer"],
  ["stack_review", "reviewer"],
  ["verification_layer", "verification"],
  ["dev_retry_gate", "verification"],
  ["qa_retry_gate", "verification"],
  ["visual_probe", "verification"],
  ["finalize_pipeline", "verification"],
  ["visual_design_review", "reviewer"],
  ["human_pm", "human_gate"],
  ["human_ba", "human_gate"],
  ["human_arch", "human_gate"],
  ["human_devops", "human_gate"],
  ["human_dev_lead", "human_gate"],
  ["human_dev", "human_gate"],
  ["human_qa", "human_gate"],
  ["human_code_review", "human_gate"],
  ["human_clarify_input", "human_gate"],
  ["human_spec", "human_gate"],
  ["human_ux_researcher", "human_gate"],
  ["human_ux_architect", "human_gate"],
  ["human_ui_designer", "human_gate"],
  ["human_seo_specialist", "human_gate"],
  ["human_ai_citation_strategist", "human_gate"],
  ["human_app_store_optimizer", "human_gate"],
  ["analyze_code", "tool_preflight"],
  ["spec_merge", "join_branch"],
] as const;

describe("step-taxonomy", () => {
  it.each(FULL_TAXONOMY_CONTRACT)("classifyStep(%s) -> %s", (stepId, expected) => {
    expect(classifyStep(stepId)).toBe(expected);
  });

  it.each([
    ["review_unknown_future", "reviewer"],
    ["human_unknown_future", "human_gate"],
    ["some_new_agent", "agent"],
    ["qa_check", "verification"],
    ["future_verify_pass", "verification"],
    ["custom_gate_step", "verification"],
  ] as const)("classifyStep fallback (%s) -> %s", (stepId, expected) => {
    expect(classifyStep(stepId)).toBe(expected);
  });

  it("summarizes mixed pipeline steps into stable buckets", () => {
    expect(
      summarizeSteps([
        "pm",
        "review_pm",
        "human_pm",
        "ba",
        "spec_merge",
        "analyze_code",
        "verification_layer",
      ]),
    ).toEqual({
      total: 7,
      agent: 2,
      reviewer: 1,
      human_gate: 1,
      verification: 1,
      tool_preflight: 1,
      join_branch: 1,
    });
  });

  it("counts every classified id exactly once", () => {
    const ids = FULL_TAXONOMY_CONTRACT.map(([stepId]) => stepId);
    const breakdown = summarizeSteps(ids);
    const bucketSum =
      breakdown.agent +
      breakdown.reviewer +
      breakdown.human_gate +
      breakdown.verification +
      breakdown.tool_preflight +
      breakdown.join_branch;
    expect(breakdown.total).toBe(ids.length);
    expect(bucketSum).toBe(ids.length);
  });
});
