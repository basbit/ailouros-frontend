import { describe, expect, it } from "vitest";
import {
  defaultAutoresearchForm,
  splitMutablePaths,
  toCreateRequest,
  validateAutoresearchForm,
  type AutoresearchFormState,
} from "../model/form";

function validForm(
  overrides: Partial<AutoresearchFormState> = {},
): AutoresearchFormState {
  return {
    ...defaultAutoresearchForm("/work/project"),
    goal: "faster",
    metricCommand: "npm run bench",
    mutablePaths: "src/**/*.ts\nlib/*.ts",
    ...overrides,
  };
}

describe("autoresearch form model", () => {
  it("defaults match the backend defaults", () => {
    const form = defaultAutoresearchForm("/w");
    expect([form.repeats, form.minImprovementPct, form.iterationBudget]).toEqual([
      3, 0.5, 20,
    ]);
    expect(form.workspaceRoot).toBe("/w");
  });

  it("accepts a complete form", () => {
    expect(validateAutoresearchForm(validForm())).toEqual([]);
  });

  it.each([
    [{ goal: " " }, "autoresearch.validation.goal"],
    [{ metricCommand: "" }, "autoresearch.validation.metricCommand"],
    [{ workspaceRoot: "" }, "autoresearch.validation.workspaceRoot"],
    [{ mutablePaths: " , \n" }, "autoresearch.validation.mutablePaths"],
    [
      { metricParseKind: "regex" as const },
      "autoresearch.validation.metricParseArgument",
    ],
    [{ repeats: 0 }, "autoresearch.validation.repeats"],
    [{ repeats: 1.5 }, "autoresearch.validation.repeats"],
    [{ iterationBudget: 201 }, "autoresearch.validation.iterationBudget"],
    [{ iterationBudget: 0 }, "autoresearch.validation.iterationBudget"],
    [{ minImprovementPct: -1 }, "autoresearch.validation.minImprovement"],
    [{ iterationTimeoutSec: 0 }, "autoresearch.validation.iterationTimeout"],
    [{ maxConsecutiveErrors: 0 }, "autoresearch.validation.maxConsecutiveErrors"],
    [{ targetValue: "fast" }, "autoresearch.validation.targetValue"],
  ])("rejects %o", (overrides, expected) => {
    expect(validateAutoresearchForm(validForm(overrides))).toContain(expected);
  });

  it("splits mutable paths on newlines and commas", () => {
    expect(splitMutablePaths("a/*.ts, b/**\n\n c.py ")).toEqual([
      "a/*.ts",
      "b/**",
      "c.py",
    ]);
  });

  it("builds the request the backend expects", () => {
    const request = toCreateRequest(
      validForm({
        metricParseKind: "regex",
        metricParseArgument: " time=(\\d+) ",
        direction: "max",
        guardCommand: " npm test ",
        targetValue: "42.5",
      }),
      { dev: { model: "m" } },
    );

    expect(request).toMatchObject({
      workspace_root: "/work/project",
      metric_parse: "regex:time=(\\d+)",
      direction: "max",
      guard_command: "npm test",
      mutable_paths: ["src/**/*.ts", "lib/*.ts"],
      target_value: 42.5,
      agent_config: { dev: { model: "m" } },
    });
  });

  it("sends last_number without an argument and no target when empty", () => {
    const request = toCreateRequest(validForm({ metricParseArgument: "ignored" }), {});
    expect(request.metric_parse).toBe("last_number");
    expect(request.target_value).toBeNull();
  });
});
