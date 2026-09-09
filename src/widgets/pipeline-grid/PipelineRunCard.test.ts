import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import PipelineRunCard from "./PipelineRunCard.vue";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmHuman: vi.fn().mockResolvedValue(undefined),
}));

describe("PipelineRunCard", () => {
  it("renders taskId and status badge", () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-test-123",
        scenarioTitle: "Test Scenario",
        status: "running",
      },
    });

    expect(wrapper.text()).toContain("task-test-123");
    expect(wrapper.text()).toContain("Test Scenario");
    expect(wrapper.classes()).not.toContain("attention-required--glow");
  });

  it("activates attention required glow and displays approve/reject buttons when awaiting_human", () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-gate-456",
        status: "awaiting_human",
      },
    });

    expect(wrapper.classes()).toContain("attention-required--glow");
    const approveBtn = wrapper.find(".pipeline-run-card__btn--approve");
    const rejectBtn = wrapper.find(".pipeline-run-card__btn--reject");
    expect(approveBtn.exists()).toBe(true);
    expect(rejectBtn.exists()).toBe(true);
  });

  it("emits open event when open run button is clicked", async () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-open-789",
        status: "completed",
      },
    });

    const openBtn = wrapper.find(".pipeline-run-card__open-btn");
    await openBtn.trigger("click");

    expect(wrapper.emitted("open")).toBeTruthy();
    expect(wrapper.emitted("open")?.[0]).toEqual(["task-open-789"]);
  });

  it("emits openBrowser event when browser button is clicked", async () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-browser-111",
        status: "running",
      },
    });

    const browserBtn = wrapper.find(".pipeline-run-card__browser-btn");
    expect(browserBtn.exists()).toBe(true);
    await browserBtn.trigger("click");

    expect(wrapper.emitted("openBrowser")).toBeTruthy();
    expect(wrapper.emitted("openBrowser")?.[0]).toEqual(["task-browser-111"]);
  });

  it("disables approve and reject buttons when locked by another user", () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-locked-222",
        status: "awaiting_human",
        claimedBy: "Remote Operator Bob",
        currentUserName: "Local Operator Alice",
      },
    });

    expect(wrapper.find(".pipeline-run-card__claimed-badge--other").exists()).toBe(
      true,
    );
    const approveBtn = wrapper.find<HTMLButtonElement>(
      ".pipeline-run-card__btn--approve",
    );
    const rejectBtn = wrapper.find<HTMLButtonElement>(
      ".pipeline-run-card__btn--reject",
    );

    expect(approveBtn.attributes("disabled")).toBeDefined();
    expect(rejectBtn.attributes("disabled")).toBeDefined();
  });
});
