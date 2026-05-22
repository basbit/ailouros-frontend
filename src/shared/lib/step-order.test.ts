import { describe, expect, it } from "vitest";
import {
  analyzePipelineStepOrder,
  formatStepOrderSummary,
  violatingStepIds,
  type StepOrderReport,
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
    expect(report.violations).toEqual([]);
  });

  it("returns no violations for an empty pipeline", () => {
    const report = analyzePipelineStepOrder([], RULES);
    expect(report.hasViolations).toBe(false);
    expect(report.violations).toEqual([]);
  });

  it("returns no violations when no step has dependency rules", () => {
    const steps = ["solo_step", "another"];
    const report = analyzePipelineStepOrder(steps, {});
    expect(report.hasViolations).toBe(false);
  });

  it("treats prerequisite at the same index as a violation (>= boundary)", () => {
    const steps = ["self_ref"];
    const report = analyzePipelineStepOrder(steps, { self_ref: ["self_ref"] });
    expect(report.hasViolations).toBe(true);
    expect(report.violations[0]).toMatchObject({
      stepId: "self_ref",
      stepIndex: 0,
      missingPrerequisite: "self_ref",
      prerequisiteIndex: 0,
    });
  });

  it("does not flag the immediate predecessor as a violation", () => {
    const steps = ["a", "b"];
    const report = analyzePipelineStepOrder(steps, { b: ["a"] });
    expect(report.hasViolations).toBe(false);
  });

  it("reports every missing prerequisite when a step requires multiple", () => {
    const steps = ["target", "lateA", "lateB"];
    const rules: Record<string, string[]> = { target: ["lateA", "lateB"] };
    const report = analyzePipelineStepOrder(steps, rules);
    expect(report.violations).toHaveLength(2);
    expect(report.violations.map((violation) => violation.missingPrerequisite)).toEqual(
      ["lateA", "lateB"],
    );
  });

  it("flags every violation in the artifact pipeline", () => {
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

  it("falls back to project default rules when no override is provided", () => {
    const report = analyzePipelineStepOrder([]);
    expect(report.violations).toEqual([]);
    expect(report.hasViolations).toBe(false);
  });
});

describe("violatingStepIds", () => {
  it("returns an empty set when there are no violations", () => {
    const ids = violatingStepIds({ violations: [], hasViolations: false });
    expect(ids.size).toBe(0);
  });

  it("deduplicates step ids that appear in multiple violation entries", () => {
    const report: StepOrderReport = {
      hasViolations: true,
      violations: [
        {
          stepId: "x",
          stepIndex: 1,
          missingPrerequisite: "a",
          prerequisiteIndex: 2,
        },
        {
          stepId: "x",
          stepIndex: 1,
          missingPrerequisite: "b",
          prerequisiteIndex: 3,
        },
        {
          stepId: "y",
          stepIndex: 2,
          missingPrerequisite: "c",
          prerequisiteIndex: 3,
        },
      ],
    };
    const ids = violatingStepIds(report);
    expect(ids.size).toBe(2);
    expect(ids.has("x")).toBe(true);
    expect(ids.has("y")).toBe(true);
  });
});

describe("formatStepOrderSummary", () => {
  it("returns an empty string when there are no violations", () => {
    const summary = formatStepOrderSummary({ violations: [], hasViolations: false });
    expect(summary).toBe("");
  });

  it("formats a single-line entry for one violation", () => {
    const report = analyzePipelineStepOrder(
      ["pm", "review_dev_lead", "dev_lead"],
      RULES,
    );
    const summary = formatStepOrderSummary(report);
    expect(summary).toContain("review_dev_lead");
    expect(summary).toContain("dev_lead");
    expect(summary).toContain("#2");
    expect(summary).toContain("#3");
  });

  it("joins multiple violations with newlines", () => {
    const report: StepOrderReport = {
      hasViolations: true,
      violations: [
        {
          stepId: "first",
          stepIndex: 0,
          missingPrerequisite: "before-first",
          prerequisiteIndex: 1,
        },
        {
          stepId: "second",
          stepIndex: 1,
          missingPrerequisite: "before-second",
          prerequisiteIndex: 2,
        },
      ],
    };
    const summary = formatStepOrderSummary(report);
    expect(summary.split("\n")).toHaveLength(2);
    expect(summary).toContain("first");
    expect(summary).toContain("second");
  });

  it("renders 'missing from pipeline' when prerequisiteIndex is null", () => {
    const report: StepOrderReport = {
      hasViolations: true,
      violations: [
        {
          stepId: "review_x",
          stepIndex: 0,
          missingPrerequisite: "x",
          prerequisiteIndex: null,
        },
      ],
    };
    const summary = formatStepOrderSummary(report);
    expect(summary).toContain("missing from pipeline");
  });

  it("renders 'currently at #N' when prerequisiteIndex is a number", () => {
    const report: StepOrderReport = {
      hasViolations: true,
      violations: [
        {
          stepId: "review_x",
          stepIndex: 0,
          missingPrerequisite: "x",
          prerequisiteIndex: 4,
        },
      ],
    };
    const summary = formatStepOrderSummary(report);
    expect(summary).toContain("currently at #5");
  });
});
