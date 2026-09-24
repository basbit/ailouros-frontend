/**
 * A phase gate is decided by an explicit button, never inferred from prose:
 * "no changes needed" used to become `changes_requested` and "looks fine"
 * silently approved. A failed decision must put the question back.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { resetPhaseGates, PHASE_GATE_DECIDED_BY } from "@/entities/phase-gate";
import type { PhaseGate } from "@/shared/model/phase-gate-types";
import { useSwarmRunGateActions } from "./useSwarmRunGateActions";

const api = vi.hoisted(() => ({
  decidePhaseGate: vi.fn(),
  listPendingPhaseGates: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/shared/api/endpoints/phase-gates", () => api);

const gateApi = vi.hoisted(() => ({
  fetchPendingHuman: vi.fn().mockResolvedValue({ pending: false }),
  submitHumanResume: vi.fn(),
  confirmHuman: vi.fn(),
  confirmShell: vi.fn(),
  confirmManualShell: vi.fn(),
  submitRetry: vi.fn(),
  submitContinuePipeline: vi.fn(),
}));
vi.mock("@/features/swarm-run/task-gate-actions", () => gateApi);

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key,
  }),
}));

function gate(): PhaseGate {
  return {
    gateId: "gate-1",
    scenario: "spec_driven_feature",
    phaseId: "spec",
    taskId: "task-1",
    summary: "",
    acceptanceCriteria: [],
    decision: "pending",
    decidedBy: "",
    decidedAt: 0,
    rationale: "",
    createdAt: 0,
    ttlSeconds: 0,
  };
}

function build() {
  const ui = useUiStore();
  const notify = vi.fn();
  const actions = useSwarmRunGateActions({
    state: { ui } as never,
    tickHandler: { applyOrchestratorEvent: vi.fn() } as never,
    sendWsSubscribe: vi.fn(),
    settings: { form: { workspace_root: "/tmp/w" } } as never,
    ux: { notify } as never,
  });
  return { ui, notify, actions };
}

describe("useSwarmRunGateActions — phase gates", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetPhaseGates();
    api.decidePhaseGate.mockReset();
    gateApi.submitHumanResume.mockReset().mockResolvedValue({ ok: true });
  });

  it("human-resume never decides a phase gate, whatever the text says", async () => {
    const { ui, actions } = build();
    ui.taskId = "task-1";

    await actions.onHumanResume("no changes needed");
    await actions.onHumanResume("reject this, request changes");

    expect(api.decidePhaseGate).not.toHaveBeenCalled();
    expect(gateApi.submitHumanResume).toHaveBeenCalledTimes(2);
  });

  it("passes the explicit decision and the rationale through under the shared actor", async () => {
    api.decidePhaseGate.mockResolvedValue({ ...gate(), decision: "changes_requested" });
    const { ui, actions } = build();
    ui.taskId = "task-1";
    ui.taskStatus = "awaiting_human";

    const ok = await actions.onDecidePhaseGate(gate(), "changes_requested", "  missing tests ");

    expect(ok).toBe(true);
    expect(api.decidePhaseGate).toHaveBeenCalledWith("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "changes_requested",
      decidedBy: PHASE_GATE_DECIDED_BY,
      rationale: "missing tests",
    });
    expect(ui.taskStatus).toBe("in_progress");
  });

  it("restores the paused state and notifies when the decision fails", async () => {
    api.decidePhaseGate.mockRejectedValue(new Error("409 Conflict"));
    const { ui, notify, actions } = build();
    ui.taskId = "task-1";
    ui.taskStatus = "awaiting_human";
    ui.pendingApprovals = 1;

    const ok = await actions.onDecidePhaseGate(gate(), "approved", "");

    expect(ok).toBe(false);
    expect(ui.taskStatus).toBe("awaiting_human");
    expect(ui.pendingApprovals).toBe(1);
    expect(notify).toHaveBeenCalledWith(
      'phaseGates.decideFailed:{"error":"409 Conflict"}',
      "error",
      expect.any(Number),
    );
  });
});

describe("useSwarmRunGateActions — human resume failure", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetPhaseGates();
  });

  it("puts the question back and notifies instead of throwing", async () => {
    gateApi.submitHumanResume.mockRejectedValueOnce(new Error("HTTP 503"));
    const { ui, notify, actions } = build();
    ui.taskId = "task-1";
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;
    ui.pendingApprovals = 2;

    const ok = await actions.onHumanResume("answer");

    expect(ok).toBe(false);
    expect(ui.taskStatus).toBe("awaiting_human");
    expect(ui.pendingApprovals).toBe(2);
    expect(ui.humanGateVisible).toBe(true);
    expect(ui.humanGateSubmitting).toBe(false);
    expect(notify).toHaveBeenCalledWith(
      'humanGate.resumeFailed:{"error":"HTTP 503"}',
      "error",
      expect.any(Number),
    );
  });
});
