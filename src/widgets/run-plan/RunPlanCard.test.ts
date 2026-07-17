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

  it("renders nothing when the scenario never ran the planner", async () => {
    const wrapper = await mountCard({
      taskId: "task-1",
      available: false,
      decisions: [],
    });
    expect(wrapper.find("section.run-plan").exists()).toBe(false);
    expect(wrapper.text()).toBe("");
  });

  it("stays visible when the lookup failed so the error is not swallowed", async () => {
    fetchMock.mockRejectedValue(new Error("run plan lookup exploded"));
    const wrapper = mount(RunPlanCard, { props: { taskId: "task-1" } });
    await flushPromises();
    expect(wrapper.find("section.run-plan").exists()).toBe(true);
    expect(wrapper.text()).toContain("run plan lookup exploded");
  });

  it("does not fetch without a task id", async () => {
    mount(RunPlanCard, { props: { taskId: null } });
    await flushPromises();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
