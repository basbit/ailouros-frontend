import { beforeEach, describe, it, expect, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineRunCard from "./PipelineRunCard.vue";
import { useUxStore } from "@/shared/store/ux";
import * as taskGatesApi from "@/shared/api/endpoints/task-gates";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmHuman: vi.fn().mockResolvedValue(undefined),
}));

describe("PipelineRunCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(taskGatesApi.postConfirmHuman).mockReset();
    vi.mocked(taskGatesApi.postConfirmHuman).mockResolvedValue(
      undefined as unknown as Awaited<ReturnType<typeof taskGatesApi.postConfirmHuman>>,
    );
  });

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

  it("sends a locale-independent marker as the gate feedback", async () => {
    const wrapper = mount(PipelineRunCard, {
      props: { taskId: "task-marker-1", status: "awaiting_human" },
    });

    await wrapper.find(".pipeline-run-card__btn--approve").trigger("click");
    await flushPromises();

    expect(taskGatesApi.postConfirmHuman).toHaveBeenCalledWith(
      "task-marker-1",
      true,
      "[multi-run-grid] approved",
    );
    expect(wrapper.emitted("gateResolved")?.[0]).toEqual(["task-marker-1", true]);
  });

  it("raises a toast when the gate decision fails instead of only logging", async () => {
    vi.mocked(taskGatesApi.postConfirmHuman).mockRejectedValue(new Error("boom"));
    const ux = useUxStore();
    const wrapper = mount(PipelineRunCard, {
      props: { taskId: "task-fail-1", status: "awaiting_human" },
    });

    await wrapper.find(".pipeline-run-card__btn--approve").trigger("click");
    await flushPromises();

    expect(wrapper.emitted("gateResolved")).toBeFalsy();
    expect(ux.toasts.length).toBe(1);
    expect(ux.toasts[0].tone).toBe("error");
    expect(ux.toasts[0].message).toContain("pipelineCard.gateActionFailed");
  });

  it("renders the run's real steps in the stage track", () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-steps-1",
        status: "running",
        steps: ["plan", "build_feature", "review_qa"],
        activeStep: "build_feature",
      },
    });

    const labels = wrapper
      .findAll(".pipeline-run-card__stage-label")
      .map((node) => node.text());
    expect(labels).toEqual(["plan", "build_feature", "review_qa"]);
    // The old hardcoded five-stage guess is gone.
    expect(labels).not.toContain("Spec");
    expect(wrapper.findAll(".pipeline-run-card__stage--active").length).toBe(1);
    expect(wrapper.findAll(".pipeline-run-card__stage--completed").length).toBe(1);
  });

  it("lights no stage for a background run whose active step is unknown", () => {
    const wrapper = mount(PipelineRunCard, {
      props: {
        taskId: "task-steps-2",
        status: "in_progress",
        steps: ["plan", "build_feature"],
        activeStep: null,
      },
    });

    expect(wrapper.findAll(".pipeline-run-card__stage--active").length).toBe(0);
    expect(wrapper.findAll(".pipeline-run-card__stage--completed").length).toBe(0);
  });
});
