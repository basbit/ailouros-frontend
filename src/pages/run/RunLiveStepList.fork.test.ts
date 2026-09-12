import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const onForkStep = vi.fn();
const push = vi.fn();

vi.mock("@/features/swarm-run", () => ({
  useInjectedSwarmRunController: () => ({ onForkStep }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import RunLiveStepList from "./RunLiveStepList.vue";

function mountList() {
  return mount(RunLiveStepList, {
    props: {
      heading: "Steps",
      steps: [{ id: "dev", state: "completed" }] as never,
      labelFor: (state: string) => state,
      taskId: "parent-1",
    },
  });
}

describe("RunLiveStepList fork entry point", () => {
  beforeEach(() => {
    onForkStep.mockReset();
    push.mockReset();
  });

  it("forks the step with the typed change and opens the forked run", async () => {
    onForkStep.mockImplementation(
      async (
        _taskId: string,
        _stepId: string,
        _instruction: string,
        onForked: (id: string) => void,
      ) => {
        onForked("fork-9");
        return "fork-9";
      },
    );
    const wrapper = mountList();

    await wrapper.find(".step-fork-btn").trigger("click");
    await wrapper.find(".run-live-steps__fork-input").setValue("try redis instead");
    await wrapper.find(".run-live-steps__fork-confirm").trigger("click");
    await flushPromises();

    expect(onForkStep).toHaveBeenCalledWith(
      "parent-1",
      "dev",
      "try redis instead",
      expect.any(Function),
    );
    expect(push).toHaveBeenCalledWith("/run/active?task_id=fork-9");
  });

  it("does not fork until the composer is confirmed", async () => {
    const wrapper = mountList();

    await wrapper.find(".step-fork-btn").trigger("click");

    expect(wrapper.find(".run-live-steps__fork-input").exists()).toBe(true);
    expect(onForkStep).not.toHaveBeenCalled();
  });

  it("closes the composer without forking on cancel", async () => {
    const wrapper = mountList();

    await wrapper.find(".step-fork-btn").trigger("click");
    await wrapper.find(".run-live-steps__fork-cancel").trigger("click");

    expect(wrapper.find(".run-live-steps__fork-input").exists()).toBe(false);
    expect(onForkStep).not.toHaveBeenCalled();
  });
});
