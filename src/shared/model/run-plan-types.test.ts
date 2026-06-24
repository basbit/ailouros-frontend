import { describe, expect, it } from "vitest";

import { parseRunPlanPayload } from "./run-plan-types";

describe("parseRunPlanPayload", () => {
  it("returns null for non-object or missing task_id", () => {
    expect(parseRunPlanPayload(null)).toBeNull();
    expect(parseRunPlanPayload({})).toBeNull();
    expect(parseRunPlanPayload({ decisions: {} })).toBeNull();
  });

  it("parses decisions and normalizes verdicts", () => {
    const plan = parseRunPlanPayload({
      task_id: "t1",
      available: true,
      decisions: {
        pm: {
          verdict: "reuse",
          confidence: 0.9,
          reason: "covered",
          source_ref: "docs/PRD.md",
        },
        dev: { verdict: "RUN", confidence: 1 },
        ba: { verdict: "GARBAGE", confidence: "x" },
      },
    });
    expect(plan).not.toBeNull();
    expect(plan?.available).toBe(true);
    const byStage = Object.fromEntries(
      (plan?.decisions ?? []).map((d) => [d.stage, d]),
    );
    expect(byStage.pm.verdict).toBe("REUSE");
    expect(byStage.pm.sourceRef).toBe("docs/PRD.md");
    expect(byStage.dev.verdict).toBe("RUN");
    expect(byStage.ba.verdict).toBe("RUN"); // unknown verdict → RUN
    expect(byStage.ba.confidence).toBe(0); // unparseable confidence → 0
  });

  it("handles unavailable plans", () => {
    const plan = parseRunPlanPayload({
      task_id: "t2",
      available: false,
      decisions: {},
    });
    expect(plan?.available).toBe(false);
    expect(plan?.decisions).toEqual([]);
  });
});
