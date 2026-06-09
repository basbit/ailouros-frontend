import { describe, expect, it } from "vitest";

import { parseOrchestrationStatusPayload } from "./orchestration-status-types";

describe("parseOrchestrationStatusPayload", () => {
  it("returns null when scenario is missing", () => {
    expect(parseOrchestrationStatusPayload({})).toBeNull();
    expect(parseOrchestrationStatusPayload(null)).toBeNull();
  });

  it("parses a full snapshot from snake_case payload", () => {
    const parsed = parseOrchestrationStatusPayload({
      scenario: "code-feature",
      phase: {
        current_phase: "execute",
        auto_advance_allowed: true,
        is_terminal: false,
        history_steps: 3,
      },
      hierarchy: {
        milestone_id: "m-1",
        milestone_title: "Bootstrap",
        plan_count: 2,
        wave_count: 5,
        task_count: 12,
        pending_tasks: 4,
        completed_tasks: 7,
        blocked_tasks: 1,
      },
      artefacts: {
        scenario: "code-feature",
        required: ["features", "stack"],
        missing: ["stack"],
        empty: [],
        uncategorised: [],
        is_complete: false,
      },
      lint: {
        enabled: true,
        error_count: 1,
        warning_count: 2,
        info_count: 0,
        blocking_count: 1,
      },
      notes: ["1 task(s) blocked"],
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.scenario).toBe("code-feature");
    expect(parsed?.phase.currentPhase).toBe("execute");
    expect(parsed?.phase.autoAdvanceAllowed).toBe(true);
    expect(parsed?.hierarchy.taskCount).toBe(12);
    expect(parsed?.hierarchy.blockedTasks).toBe(1);
    expect(parsed?.artefacts.missing).toEqual(["stack"]);
    expect(parsed?.artefacts.isComplete).toBe(false);
    expect(parsed?.lint.blockingCount).toBe(1);
    expect(parsed?.notes).toEqual(["1 task(s) blocked"]);
  });

  it("fills defaults when block payloads are missing", () => {
    const parsed = parseOrchestrationStatusPayload({ scenario: "default" });
    expect(parsed?.phase.currentPhase).toBe("");
    expect(parsed?.phase.autoAdvanceAllowed).toBe(false);
    expect(parsed?.hierarchy.taskCount).toBe(0);
    expect(parsed?.artefacts.required).toEqual([]);
    expect(parsed?.artefacts.isComplete).toBe(true);
    expect(parsed?.lint.enabled).toBe(false);
    expect(parsed?.notes).toEqual([]);
  });

  it("drops non-string note entries", () => {
    const parsed = parseOrchestrationStatusPayload({
      scenario: "default",
      notes: ["ok", 42, null, "another"],
    });
    expect(parsed?.notes).toEqual(["ok", "another"]);
  });

  it("treats is_complete missing as true", () => {
    const parsed = parseOrchestrationStatusPayload({
      scenario: "default",
      artefacts: { scenario: "default" },
    });
    expect(parsed?.artefacts.isComplete).toBe(true);
  });
});
