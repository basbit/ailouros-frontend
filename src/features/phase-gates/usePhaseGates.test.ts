import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PhaseGate, PhaseGateDecision } from "@/entities/phase-gate";

import { resetPhaseGates, usePhaseGates } from "./usePhaseGates";

const listMock = vi.fn<(workspaceRoot: string) => Promise<PhaseGate[]>>();
const decideMock = vi.fn<
  (
    gateId: string,
    input: {
      workspaceRoot: string;
      decision: PhaseGateDecision;
      decidedBy: string;
      rationale?: string;
    },
  ) => Promise<PhaseGate>
>();

vi.mock("@/shared/api/endpoints/phase-gates", () => ({
  listPendingPhaseGates: (workspaceRoot: string) => listMock(workspaceRoot),
  decidePhaseGate: (
    gateId: string,
    input: {
      workspaceRoot: string;
      decision: PhaseGateDecision;
      decidedBy: string;
      rationale?: string;
    },
  ) => decideMock(gateId, input),
}));

function buildGate(overrides: Partial<PhaseGate> = {}): PhaseGate {
  return {
    gateId: "gate-1",
    scenario: "code-feature",
    phaseId: "execute",
    taskId: "task-1",
    summary: "",
    acceptanceCriteria: [],
    decision: "pending",
    decidedBy: "",
    decidedAt: 0,
    rationale: "",
    createdAt: 1700000000,
    ttlSeconds: 0,
    ...overrides,
  };
}

describe("usePhaseGates", () => {
  beforeEach(() => {
    resetPhaseGates();
    listMock.mockReset();
    decideMock.mockReset();
  });

  it("starts with no gates and not loading", () => {
    const gates = usePhaseGates();
    expect(gates.pendingGates.value).toEqual([]);
    expect(gates.loading.value).toBe(false);
    expect(gates.visible.value).toBe(false);
  });

  it("refresh trims workspaceRoot and skips network when blank", async () => {
    const gates = usePhaseGates();
    await gates.refresh("   ");
    expect(listMock).not.toHaveBeenCalled();
  });

  it("refresh populates pending gates and toggles loading", async () => {
    listMock.mockResolvedValue([buildGate(), buildGate({ gateId: "gate-2" })]);
    const gates = usePhaseGates();
    const requestPromise = gates.refresh("/tmp/w");
    expect(gates.loading.value).toBe(true);
    await requestPromise;
    expect(gates.loading.value).toBe(false);
    expect(gates.pendingGates.value).toHaveLength(2);
    expect(gates.visible.value).toBe(true);
  });

  it("decide removes the gate from pending on success", async () => {
    listMock.mockResolvedValue([buildGate(), buildGate({ gateId: "gate-2" })]);
    decideMock.mockResolvedValue(buildGate({ decision: "approved" }));
    const gates = usePhaseGates();
    await gates.refresh("/tmp/w");
    const ok = await gates.decide("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "approved",
      decidedBy: "operator",
    });
    expect(ok).toBe(true);
    expect(gates.pendingGates.value.map((gate) => gate.gateId)).toEqual(["gate-2"]);
  });

  it("decide surfaces the error and returns false on failure", async () => {
    decideMock.mockRejectedValue(new Error("409 Conflict"));
    const gates = usePhaseGates();
    const ok = await gates.decide("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "approved",
      decidedBy: "operator",
    });
    expect(ok).toBe(false);
    expect(gates.lastError.value).toBe("409 Conflict");
  });
});
