import { describe, expect, it } from "vitest";
import { classifyStep, summarizeSteps } from "@/shared/lib/step-taxonomy";

describe("step-taxonomy", () => {
  it.each([
    ["review_pm", "reviewer"],
    ["human_pm", "human_gate"],
    ["pm", "agent"],
    ["analyze_code", "tool_preflight"],
    ["spec_merge", "join_branch"],
    ["dev_retry_gate", "verification"],
    ["review_unknown_future", "reviewer"],
    ["human_unknown_future", "human_gate"],
    ["some_new_agent", "agent"],
  ] as const)("classifyStep(%s) -> %s", (stepId, expected) => {
    expect(classifyStep(stepId)).toBe(expected);
  });

  it("summarizes mixed pipeline steps into stable buckets", () => {
    expect(summarizeSteps(["pm", "review_pm", "human_pm", "ba"])).toEqual({
      total: 4,
      agent: 2,
      reviewer: 1,
      human_gate: 1,
      verification: 0,
      tool_preflight: 0,
      join_branch: 0,
    });
  });

  it("classifies verification-ish future ids by semantic suffix", () => {
    expect(classifyStep("qa_check")).toBe("verification");
    expect(classifyStep("future_verify_pass")).toBe("verification");
  });
});
