import { describe, expect, it } from "vitest";

import { parsePhaseGatePayload } from "./phase-gate-types";

describe("parsePhaseGatePayload", () => {
  it("returns null when gate_id is missing", () => {
    expect(parsePhaseGatePayload({})).toBeNull();
    expect(parsePhaseGatePayload({ gate_id: "" })).toBeNull();
  });

  it("returns null when decision is unknown", () => {
    expect(parsePhaseGatePayload({ gate_id: "g1", decision: "unknown" })).toBeNull();
  });

  it("parses a full pending gate payload", () => {
    const parsed = parsePhaseGatePayload({
      gate_id: "gate-abc",
      scenario: "code-feature",
      phase_id: "execute",
      task_id: "task-1",
      summary: "Approve outputs",
      acceptance_criteria: ["files written", "lint passes"],
      decision: "pending",
      decided_by: "",
      decided_at: 0,
      rationale: "",
      created_at: 1700000000,
      ttl_seconds: 600,
    });
    expect(parsed?.gateId).toBe("gate-abc");
    expect(parsed?.scenario).toBe("code-feature");
    expect(parsed?.decision).toBe("pending");
    expect(parsed?.acceptanceCriteria).toEqual(["files written", "lint passes"]);
    expect(parsed?.ttlSeconds).toBe(600);
  });

  it("trims ttl_seconds to integer", () => {
    const parsed = parsePhaseGatePayload({
      gate_id: "gate-abc",
      decision: "pending",
      ttl_seconds: 600.7,
    });
    expect(parsed?.ttlSeconds).toBe(600);
  });

  it("drops non-string acceptance_criteria entries", () => {
    const parsed = parsePhaseGatePayload({
      gate_id: "gate-abc",
      decision: "pending",
      acceptance_criteria: ["ok", 42, null, "another"],
    });
    expect(parsed?.acceptanceCriteria).toEqual(["ok", "another"]);
  });
});
