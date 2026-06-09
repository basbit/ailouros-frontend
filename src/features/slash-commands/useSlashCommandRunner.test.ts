import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetSlashCommandRunner,
  useSlashCommandRunner,
} from "./useSlashCommandRunner";

const dispatchMock = vi.fn();
const evaluateMock = vi.fn();

vi.mock("@/shared/api/endpoints/skill-dispatcher", () => ({
  dispatchSkill: (input: unknown) => dispatchMock(input),
}));

vi.mock("@/shared/api/endpoints/quick-fix", () => ({
  evaluateQuickFix: (input: unknown) => evaluateMock(input),
}));

describe("useSlashCommandRunner", () => {
  beforeEach(() => {
    resetSlashCommandRunner();
    dispatchMock.mockReset();
    evaluateMock.mockReset();
  });

  it("returns null for non-slash text and does not call any endpoint", async () => {
    const runner = useSlashCommandRunner();
    const outcome = await runner.tryRun("just a prompt");
    expect(outcome).toBeNull();
    expect(dispatchMock).not.toHaveBeenCalled();
    expect(evaluateMock).not.toHaveBeenCalled();
  });

  it("routes /dispatch to the skill dispatcher and reports the decision", async () => {
    dispatchMock.mockResolvedValue({
      skillId: "frontend-design",
      reason: "matched vue",
      dispatcher: "heuristic",
      mode: "heuristic",
      candidates: [],
    });
    const runner = useSlashCommandRunner();
    const outcome = await runner.tryRun("/dispatch make a Vue page", {
      scenario: "code-feature",
    });
    expect(outcome?.kind).toBe("dispatch");
    expect(outcome?.summary).toContain("frontend-design");
    expect(dispatchMock).toHaveBeenCalledWith({
      scenario: "code-feature",
      phase: "",
      userInput: "make a Vue page",
    });
  });

  it("routes /quick to the quick-fix evaluator with parsed payload", async () => {
    evaluateMock.mockResolvedValue({
      verdict: "accept",
      reason: "single file under budget",
      blockingFile: "",
      blockingRule: "",
      maxLoc: 20,
    });
    const runner = useSlashCommandRunner();
    const outcome = await runner.tryRun("/quick rename function | src/util.py | 5");
    expect(outcome?.kind).toBe("quick");
    expect(evaluateMock).toHaveBeenCalledWith({
      description: "rename function",
      targetFiles: ["src/util.py"],
      estimatedLoc: 5,
    });
  });

  it("throws when /dispatch payload is empty", async () => {
    const runner = useSlashCommandRunner();
    await expect(runner.tryRun("/dispatch    ")).rejects.toThrow("/dispatch needs");
  });

  it("throws when /quick is missing files", async () => {
    const runner = useSlashCommandRunner();
    await expect(runner.tryRun("/quick desc only")).rejects.toThrow("/quick needs");
  });

  it("captures lastError when endpoint rejects", async () => {
    dispatchMock.mockRejectedValue(new Error("503"));
    const runner = useSlashCommandRunner();
    await expect(runner.tryRun("/dispatch x")).rejects.toThrow("503");
    expect(runner.lastError.value).toBe("503");
  });
});
