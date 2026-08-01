import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import SpecStatusChip from "./SpecStatusChip.vue";

function mountChip(raw: unknown) {
  return mount(SpecStatusChip, { props: { status: raw } });
}

describe("SpecStatusChip", () => {
  it("renders nothing without a status record", () => {
    expect(mountChip(null).find(".spec-status-chip").exists()).toBe(false);
    expect(mountChip({}).text()).toBe("");
  });

  it("shows a live status", () => {
    const wrapper = mountChip({ status: "ready-for-dev" });

    expect(wrapper.find(".spec-status-chip").exists()).toBe(true);
    expect(wrapper.text()).toContain("ready for dev");
  });

  it("shows why the run stopped when the spec is blocked", () => {
    const wrapper = mountChip({
      status: "blocked",
      blocking_condition: "spec incomplete after retry: ['task-1: intent']",
    });

    expect(wrapper.text()).toContain("blocked");
    expect(wrapper.text()).toContain("spec incomplete after retry");
  });

  it("marks the blocked state so it can be styled apart", () => {
    expect(
      mountChip({ status: "blocked", blocking_condition: "x" })
        .find(".is-blocked")
        .exists(),
    ).toBe(true);
    expect(mountChip({ status: "done" }).find(".is-blocked").exists()).toBe(false);
  });

  it("ignores a status the backend does not define", () => {
    expect(mountChip({ status: "made-up" }).find(".spec-status-chip").exists()).toBe(
      false,
    );
  });
});
