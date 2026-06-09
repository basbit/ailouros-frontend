import { describe, expect, it } from "vitest";

import { customScenarioToSummary } from "./useSwarmRunPreflight";

describe("customScenarioToSummary", () => {
  it("builds a runnable summary with no required inputs", () => {
    const summary = customScenarioToSummary({
      id: "spec_driven_feature-copy-mpdq9vvm",
      title: "Spec Driven (copy)",
      pipeline_steps: ["spec", "build", "review"],
      workspace_write_default: true,
      topology: "ring",
    });

    expect(summary.id).toBe("spec_driven_feature-copy-mpdq9vvm");
    expect(summary.category).toBe("custom");
    expect(summary.pipeline_steps).toEqual(["spec", "build", "review"]);
    expect(summary.workspace_write_default).toBe(true);
    expect(summary.inputs).toEqual([]);
    expect(summary.inputs.every((input) => !input.required)).toBe(true);
  });
});
