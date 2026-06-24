import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import type { RunPlan } from "@/shared/model/run-plan-types";
import RunPlanCard from "./RunPlanCard.vue";

const fetchMock = vi.fn();

vi.mock("@/shared/api/endpoints/run-plan", () => ({
  getRunPlan: (taskId: string) => fetchMock(taskId),
}));

async function mountCard(plan: RunPlan) {
  fetchMock.mockResolvedValue(plan);
  const wrapper = mount(RunPlanCard, { props: { taskId: "task-1" } });
  await flushPromises();
  return wrapper;
}

describe("RunPlanCard", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("renders one row per stage with verdict and source", async () => {
    const wrapper = await mountCard({
      taskId: "task-1",
      available: true,
      decisions: [
        {
          stage: "pm",
          verdict: "REUSE",
          confidence: 0.9,
          reason: "covered",
          sourceRef: "docs/PRD.md",
        },
        {
          stage: "dev",
          verdict: "RUN",
          confidence: 1,
          reason: "new code",
          sourceRef: "",
        },
      ],
    });
    const rows = wrapper.findAll(".run-plan__row");
    expect(rows).toHaveLength(2);
    expect(wrapper.text()).toContain("pm");
    expect(wrapper.text()).toContain("REUSE");
    expect(wrapper.text()).toContain("docs/PRD.md");
    expect(wrapper.find('[data-verdict="RUN"]').exists()).toBe(true);
  });

  it("shows the unavailable hint when the orchestrator produced no plan", async () => {
    const wrapper = await mountCard({
      taskId: "task-1",
      available: false,
      decisions: [],
    });
    expect(wrapper.findAll(".run-plan__row")).toHaveLength(0);
    expect(wrapper.find(".run-plan__hint").exists()).toBe(true);
  });

  it("does not fetch without a task id", async () => {
    mount(RunPlanCard, { props: { taskId: null } });
    await flushPromises();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
