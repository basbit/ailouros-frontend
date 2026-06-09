import { beforeEach, describe, expect, it, vi } from "vitest";

import type { QuickFixDecision } from "@/entities/quick-fix";
import { resetQuickFix, useQuickFix } from "./useQuickFix";

const evaluateMock =
  vi.fn<
    (input: {
      description: string;
      targetFiles: readonly string[];
      estimatedLoc: number;
    }) => Promise<QuickFixDecision>
  >();

vi.mock("@/shared/api/endpoints/quick-fix", () => ({
  evaluateQuickFix: (input: {
    description: string;
    targetFiles: readonly string[];
    estimatedLoc: number;
  }) => evaluateMock(input),
}));

function makeDecision(overrides: Partial<QuickFixDecision> = {}): QuickFixDecision {
  return {
    verdict: "accept",
    reason: "single file under budget",
    blockingFile: "",
    blockingRule: "",
    maxLoc: 20,
    ...overrides,
  };
}

describe("useQuickFix", () => {
  beforeEach(() => {
    resetQuickFix();
    evaluateMock.mockReset();
  });

  it("skips when description or files are empty", async () => {
    const composable = useQuickFix();
    await composable.run({
      description: "   ",
      targetFiles: ["src/util.py"],
      estimatedLoc: 0,
    });
    await composable.run({
      description: "rename",
      targetFiles: ["", "   "],
      estimatedLoc: 0,
    });
    expect(evaluateMock).not.toHaveBeenCalled();
  });

  it("trims description and filters blank files before evaluating", async () => {
    evaluateMock.mockResolvedValue(makeDecision());
    const composable = useQuickFix();
    await composable.run({
      description: "  rename a function  ",
      targetFiles: [" src/util.py ", "", "  "],
      estimatedLoc: 5,
    });
    expect(evaluateMock).toHaveBeenCalledWith({
      description: "rename a function",
      targetFiles: ["src/util.py"],
      estimatedLoc: 5,
    });
  });

  it("stores the decision after a successful call", async () => {
    evaluateMock.mockResolvedValue(makeDecision({ verdict: "reject" }));
    const composable = useQuickFix();
    await composable.run({
      description: "x",
      targetFiles: ["a.py"],
      estimatedLoc: 1,
    });
    expect(composable.decision.value?.verdict).toBe("reject");
    expect(composable.visible.value).toBe(true);
  });

  it("records the error message when the endpoint throws", async () => {
    evaluateMock.mockRejectedValue(new Error("503 disabled"));
    const composable = useQuickFix();
    await composable.run({
      description: "x",
      targetFiles: ["a.py"],
      estimatedLoc: 1,
    });
    expect(composable.decision.value).toBeNull();
    expect(composable.lastError.value).toBe("503 disabled");
  });

  it("clear empties the stored decision", async () => {
    evaluateMock.mockResolvedValue(makeDecision());
    const composable = useQuickFix();
    await composable.run({
      description: "x",
      targetFiles: ["a.py"],
      estimatedLoc: 1,
    });
    composable.clear();
    expect(composable.decision.value).toBeNull();
  });
});
