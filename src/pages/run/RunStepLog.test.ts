import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import RunStepLog from "./RunStepLog.vue";
import type { LogClass, LogFilter, StepLogGroup } from "./useRunLiveSteps";

const groups: StepLogGroup[] = [
  {
    id: "pm",
    label: "pm",
    state: "completed",
    durationMs: 30_000,
    events: [
      { agent: "pm", message: "framed the task", status: "completed", timestamp: "t1" },
    ],
  },
  {
    id: "ba",
    label: "ba",
    state: "pending",
    durationMs: null,
    events: [], // no output, not active/failed → hidden
  },
  {
    id: "dev",
    label: "dev",
    state: "active",
    durationMs: null,
    events: [
      { agent: "dev", message: "writing code", status: "in_progress", timestamp: "t2" },
    ],
  },
];

function mountLog(overrides: Partial<{ groups: StepLogGroup[] }> = {}) {
  return mount(RunStepLog, {
    props: {
      filter: "all" as LogFilter,
      filterOptions: [{ key: "all" as LogFilter, label: "All" }],
      groups: overrides.groups ?? groups,
      emptyText: "No events yet",
      emptyStepText: "No output for this step yet.",
      classify: () => "agent" as LogClass,
      formatTime: () => "00:00:00",
    },
  });
}

describe("RunStepLog", () => {
  it("renders one collapsible section per step with output (or active/failed)", () => {
    const wrapper = mountLog();
    const names = wrapper.findAll(".run-step-log__name").map((n) => n.text());
    // pm (has output) and dev (active) show; ba (empty + pending) is hidden.
    expect(names).toContain("pm");
    expect(names).toContain("dev");
    expect(names).not.toContain("ba");
  });

  it("shows per-step duration and message count", () => {
    const wrapper = mountLog();
    expect(wrapper.text()).toContain("30s");
    expect(wrapper.find(".run-step-log__count").text()).toBe("1");
  });

  it("auto-expands the active step and renders its messages", () => {
    const wrapper = mountLog();
    const devSection = wrapper
      .findAll(".run-step-log__group")
      .find((el) => el.find(".run-step-log__name").text() === "dev");
    expect(devSection?.attributes("open")).toBeDefined();
    expect(wrapper.text()).toContain("writing code");
  });

  it("renders the empty state when there are no visible groups", () => {
    const wrapper = mountLog({ groups: [] });
    expect(wrapper.find(".run-step-log__empty").text()).toBe("No events yet");
  });
});
