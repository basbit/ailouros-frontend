import { describe, expect, it } from "vitest";
import {
  defaultPromptPresetForm,
  toImproveRolePromptRequest,
  validatePromptPresetForm,
} from "../model/promptPreset";

const ROLES = ["dev", "pm", "qa"];

describe("prompt preset form model", () => {
  it("accepts the defaults for a role with golden cases", () => {
    expect(validatePromptPresetForm(defaultPromptPresetForm("pm", "goal"), ROLES)).toEqual([]);
  });

  it.each([
    [{ role: "architect" }, "autoresearch.prompt.validation.role"],
    [{ goal: "  " }, "autoresearch.validation.goal"],
    [{ samples: 0 }, "autoresearch.prompt.validation.samples"],
    [{ samples: 21 }, "autoresearch.prompt.validation.samples"],
    [{ samples: 1.5 }, "autoresearch.prompt.validation.samples"],
    [{ iterationBudget: 0 }, "autoresearch.validation.iterationBudget"],
    [{ iterationBudget: 201 }, "autoresearch.validation.iterationBudget"],
    [{ repeats: 0 }, "autoresearch.validation.repeats"],
    [{ minImprovementPct: -1 }, "autoresearch.validation.minImprovement"],
  ])("reports %o", (override, problem) => {
    const state = { ...defaultPromptPresetForm("pm", "goal"), ...override };

    expect(validatePromptPresetForm(state, ROLES)).toContain(problem);
  });

  it("builds the preset request with trimmed text", () => {
    const state = {
      ...defaultPromptPresetForm("qa", "  raise the score  "),
      judgeModel: " judge-1 ",
    };

    expect(toImproveRolePromptRequest(state, { qa: { model: "m" } })).toEqual({
      role: "qa",
      goal: "raise the score",
      samples: 2,
      iteration_budget: 10,
      repeats: 1,
      min_improvement_pct: 0.5,
      judge_model: "judge-1",
      agent_config: { qa: { model: "m" } },
    });
  });
});
