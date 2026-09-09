import { describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import StepForkButton from "../StepForkButton.vue";
import * as taskForkApi from "@/entities/task/api/task-fork-api";

vi.mock("@/entities/task/api/task-fork-api", () => ({
  forkTaskStep: vi.fn(),
}));

describe("StepForkButton", () => {
  it("renders fork button and handles click", async () => {
    vi.mocked(taskForkApi.forkTaskStep).mockResolvedValue({
      forked_task_id: "forked-task-99",
      parent_task_id: "parent-task-1",
      step_id: "arch_step",
      snapshot_keys: ["code"],
      message: "Forked",
    });

    const wrapper = mount(StepForkButton, {
      props: {
        taskId: "parent-task-1",
        stepId: "arch_step",
      },
    });

    expect(wrapper.find(".step-fork-btn").exists()).toBe(true);
    await wrapper.find(".step-fork-btn").trigger("click");
    await flushPromises();

    expect(taskForkApi.forkTaskStep).toHaveBeenCalledWith("parent-task-1", {
      step_id: "arch_step",
    });
    expect(wrapper.emitted("forked")).toBeTruthy();
    expect(wrapper.emitted("forked")?.[0]).toEqual(["forked-task-99"]);
  });
});
