import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";

import type { PhaseGate, PhaseGateDecision } from "@/shared/model/phase-gate-types";

import {
  PHASE_GATE_DECIDED_BY,
  PHASE_GATE_POLL_INTERVAL_MS,
  resetPhaseGates,
  usePhaseGatePolling,
  usePhaseGates,
} from "./usePhaseGates";

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
    });
    expect(ok).toBe(true);
    expect(gates.pendingGates.value.map((gate) => gate.gateId)).toEqual(["gate-2"]);
  });

  it("records every decision under the one shared actor and passes the rationale through", async () => {
    decideMock.mockResolvedValue(buildGate({ decision: "changes_requested" }));
    const gates = usePhaseGates();
    await gates.decide("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "changes_requested",
      rationale: "the spec misses the error path",
    });
    expect(decideMock).toHaveBeenCalledWith("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "changes_requested",
      decidedBy: PHASE_GATE_DECIDED_BY,
      rationale: "the spec misses the error path",
    });
  });

  it("decide surfaces the error and returns false on failure", async () => {
    decideMock.mockRejectedValue(new Error("409 Conflict"));
    const gates = usePhaseGates();
    const ok = await gates.decide("gate-1", {
      workspaceRoot: "/tmp/w",
      decision: "approved",
    });
    expect(ok).toBe(false);
    expect(gates.lastError.value).toBe("409 Conflict");
  });
});

describe("usePhaseGates — one request per workspace at a time", () => {
  beforeEach(() => {
    resetPhaseGates();
    listMock.mockReset();
  });

  it("collapses concurrent refreshes of the same workspace into one GET", async () => {
    let release: (gates: PhaseGate[]) => void = () => undefined;
    listMock.mockImplementation(
      () =>
        new Promise<PhaseGate[]>((resolve) => {
          release = resolve;
        }),
    );
    const gates = usePhaseGates();

    const first = gates.refresh("/tmp/w");
    const second = gates.refresh("/tmp/w");
    const third = gates.refresh("/tmp/w ");
    release([buildGate()]);
    await Promise.all([first, second, third]);

    expect(listMock).toHaveBeenCalledTimes(1);
    expect(gates.pendingGates.value).toHaveLength(1);
  });

  it("issues a fresh request once the previous one settled", async () => {
    listMock.mockResolvedValue([]);
    const gates = usePhaseGates();
    await gates.refresh("/tmp/w");
    await gates.refresh("/tmp/w");
    expect(listMock).toHaveBeenCalledTimes(2);
  });
});

describe("usePhaseGatePolling — one shared interval", () => {
  beforeEach(() => {
    resetPhaseGates();
    listMock.mockReset();
    listMock.mockResolvedValue([]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function poller(root: () => string | null) {
    return defineComponent({
      setup() {
        usePhaseGatePolling(root);
        return () => h("div");
      },
    });
  }

  it("polls once per tick no matter how many consumers subscribe", async () => {
    const a = mount(poller(() => "/tmp/w"));
    const b = mount(poller(() => "/tmp/w"));
    const c = mount(poller(() => "/tmp/w"));
    await nextTick();
    expect(listMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(PHASE_GATE_POLL_INTERVAL_MS);
    expect(listMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(PHASE_GATE_POLL_INTERVAL_MS);
    expect(listMock).toHaveBeenCalledTimes(3);

    a.unmount();
    b.unmount();
    c.unmount();
  });

  it("keeps polling while any consumer is left and stops with the last one", async () => {
    const a = mount(poller(() => "/tmp/w"));
    const b = mount(poller(() => "/tmp/w"));
    await nextTick();
    a.unmount();

    await vi.advanceTimersByTimeAsync(PHASE_GATE_POLL_INTERVAL_MS);
    expect(listMock).toHaveBeenCalledTimes(2);

    b.unmount();
    await vi.advanceTimersByTimeAsync(PHASE_GATE_POLL_INTERVAL_MS * 3);
    expect(listMock).toHaveBeenCalledTimes(2);
  });

  it("does not poll without a workspace and starts once one is set", async () => {
    const root = ref<string | null>(null);
    const wrapper = mount(poller(() => root.value));
    await nextTick();
    await vi.advanceTimersByTimeAsync(PHASE_GATE_POLL_INTERVAL_MS);
    expect(listMock).not.toHaveBeenCalled();

    root.value = "/tmp/w";
    await nextTick();
    expect(listMock).toHaveBeenCalledTimes(1);
    expect(listMock).toHaveBeenCalledWith("/tmp/w");
    wrapper.unmount();
  });
});
