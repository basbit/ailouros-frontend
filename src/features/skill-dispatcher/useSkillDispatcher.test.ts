import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SkillDispatchDecision } from "@/entities/skill-dispatch";
import { resetSkillDispatcher, useSkillDispatcher } from "./useSkillDispatcher";

const dispatchMock =
  vi.fn<
    (input: {
      scenario: string;
      phase: string;
      userInput: string;
    }) => Promise<SkillDispatchDecision>
  >();

vi.mock("@/shared/api/endpoints/skill-dispatcher", () => ({
  dispatchSkill: (input: { scenario: string; phase: string; userInput: string }) =>
    dispatchMock(input),
}));

function makeDecision(
  overrides: Partial<SkillDispatchDecision> = {},
): SkillDispatchDecision {
  return {
    skillId: "frontend-design",
    reason: "matched ui keywords",
    dispatcher: "heuristic",
    mode: "heuristic",
    candidates: ["frontend-design", "generalist"],
    ...overrides,
  };
}

describe("useSkillDispatcher", () => {
  beforeEach(() => {
    resetSkillDispatcher();
    dispatchMock.mockReset();
  });

  it("skips the request when user_input is blank", async () => {
    const composable = useSkillDispatcher();
    await composable.run({ scenario: "default", phase: "", userInput: "   " });
    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it("trims the user_input before dispatching", async () => {
    dispatchMock.mockResolvedValue(makeDecision());
    const composable = useSkillDispatcher();
    await composable.run({
      scenario: "default",
      phase: "plan",
      userInput: "  build a Vue page  ",
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      scenario: "default",
      phase: "plan",
      userInput: "build a Vue page",
    });
  });

  it("stores the decision and exposes visibility", async () => {
    dispatchMock.mockResolvedValue(makeDecision({ skillId: "documentation" }));
    const composable = useSkillDispatcher();
    await composable.run({ scenario: "x", phase: "", userInput: "wiki" });
    expect(composable.decision.value?.skillId).toBe("documentation");
    expect(composable.visible.value).toBe(true);
  });

  it("captures errors and clears loading", async () => {
    dispatchMock.mockRejectedValue(new Error("503 dispatcher off"));
    const composable = useSkillDispatcher();
    await composable.run({ scenario: "x", phase: "", userInput: "ok" });
    expect(composable.decision.value).toBeNull();
    expect(composable.lastError.value).toBe("503 dispatcher off");
    expect(composable.loading.value).toBe(false);
  });

  it("clear empties the stored decision", async () => {
    dispatchMock.mockResolvedValue(makeDecision());
    const composable = useSkillDispatcher();
    await composable.run({ scenario: "x", phase: "", userInput: "ok" });
    composable.clear();
    expect(composable.decision.value).toBeNull();
    expect(composable.visible.value).toBe(false);
  });
});
