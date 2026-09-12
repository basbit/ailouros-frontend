import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import PhaseGateCard from "./PhaseGateCard.vue";
import { resetPhaseGates } from "@/features/phase-gates/usePhaseGates";

const listMock = vi.fn();

vi.mock("@/shared/api/endpoints/phase-gates", () => ({
  listPendingPhaseGates: (root: string) => listMock(root),
  decidePhaseGate: vi.fn(),
}));

async function mountCard() {
  resetPhaseGates();
  const wrapper = mount(PhaseGateCard, { props: { workspaceRoot: "/tmp/work" } });
  await flushPromises();
  return wrapper;
}

describe("PhaseGateCard visibility", () => {
  beforeEach(() => {
    listMock.mockReset();
  });

  it("renders nothing when no gate awaits a decision", async () => {
    listMock.mockResolvedValue([]);
    const wrapper = await mountCard();
    expect(wrapper.find("section.phase-gate-card").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("appears once a gate is pending", async () => {
    listMock.mockResolvedValue([
      {
        gateId: "gate-1",
        scenario: "spec_driven_feature",
        phaseId: "spec",
        taskId: "task-1",
        summary: "review the spec",
        acceptanceCriteria: ["criterion one"],
        decision: "pending",
      },
    ]);
    const wrapper = await mountCard();
    expect(wrapper.find("section.phase-gate-card").exists()).toBe(true);
    expect(wrapper.text()).toContain("spec");
    expect(wrapper.text()).toContain("review the spec");
  });

  it("stays visible when the lookup failed so the error is not swallowed", async () => {
    listMock.mockRejectedValue(new Error("gate lookup exploded"));
    const wrapper = await mountCard();
    expect(wrapper.find("section.phase-gate-card").exists()).toBe(true);
    expect(wrapper.text()).toContain("gate lookup exploded");
  });

  it("filters out gates belonging to other tasks when taskId prop is provided", async () => {
    listMock.mockResolvedValue([
      {
        gateId: "gate-1",
        scenario: "spec_driven_feature",
        phaseId: "spec",
        taskId: "task-other",
        summary: "other task spec",
        acceptanceCriteria: [],
        decision: "pending",
      },
    ]);
    resetPhaseGates();
    const wrapper = mount(PhaseGateCard, {
      props: { workspaceRoot: "/tmp/work", taskId: "task-my-current" },
    });
    await flushPromises();
    expect(wrapper.find("section.phase-gate-card").exists()).toBe(false);
  });
});
