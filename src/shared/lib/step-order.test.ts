import { describe, expect, it } from "vitest";
import {
  analyzePipelineStepOrder,
  formatStepOrderSummary,
  violatingStepIds,
} from "@/shared/lib/step-order";

const RULES: Record<string, string[]> = {
  review_pm: ["pm"],
  review_dev_lead: ["dev_lead"],
  review_dev: ["dev"],
  dev: ["dev_lead"],
  qa: ["dev"],
};

describe("analyzePipelineStepOrder", () => {
  it("returns no violations for the canonical order", () => {
    const steps = [
      "clarify_input",
      "pm",
      "review_pm",
      "dev_lead",
      "review_dev_lead",
      "dev",
      "review_dev",
      "qa",
    ];

    const report = analyzePipelineStepOrder(steps, RULES);

    expect(report.hasViolations).toBe(false);
    expect(report.violations).toEqual([]);
  });

  it("flags review_dev_lead placed before dev_lead", () => {
    const steps = ["pm", "review_dev_lead", "dev_lead"];

    const report = analyzePipelineStepOrder(steps, RULES);

    expect(report.hasViolations).toBe(true);
    expect(report.violations).toContainEqual({
      stepId: "review_dev_lead",
      stepIndex: 1,
      missingPrerequisite: "dev_lead",
      prerequisiteIndex: 2,
    });
  });

  it("does not flag prerequisites that are absent from the pipeline", () => {
    const steps = ["clarify_input", "review_pm"];

    const report = analyzePipelineStepOrder(steps, RULES);

    expect(report.hasViolations).toBe(false);
  });

  it("flags every violation in the artifact 1fa3b6ad pipeline", () => {
    const steps = [
      "clarify_input",
      "pm",
      "architect",
      "devops",
      "review_dev_lead",
      "dev",
      "dev_lead",
      "review_devops",
      "qa",
      "review_qa",
      "review_dev",
      "asset_fetcher",
      "ui_designer",
    ];
    const rules: Record<string, string[]> = {
      ...RULES,
      review_devops: ["devops"],
      review_qa: ["qa"],
    };

    const report = analyzePipelineStepOrder(steps, rules);

    const flagged = violatingStepIds(report);
    expect(flagged.has("review_dev_lead")).toBe(true);
    expect(flagged.has("dev")).toBe(true);
  });

  it("formats a multiline summary for violations", () => {
    const report = analyzePipelineStepOrder(
      ["pm", "review_dev_lead", "dev_lead"],
      RULES,
    );

    const summary = formatStepOrderSummary(report);

    expect(summary).toContain("review_dev_lead");
    expect(summary).toContain("dev_lead");
  });
});
