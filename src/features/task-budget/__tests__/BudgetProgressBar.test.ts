import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import BudgetProgressBar from "../BudgetProgressBar.vue";

describe("BudgetProgressBar", () => {
  it("renders normal green state when consumption is below 80%", () => {
    const wrapper = mount(BudgetProgressBar, {
      props: {
        budgetUsd: 10.0,
        consumedUsd: 4.0,
      },
    });

    const fill = wrapper.find(".budget-progress-fill");
    expect(fill.exists()).toBe(true);
    expect(fill.classes()).not.toContain("budget-progress-fill--warning");
    expect(fill.classes()).not.toContain("budget-progress-fill--exhausted");
    expect(wrapper.text()).toContain("$4.00 / $10.00");
    expect(wrapper.text()).toContain("40%");
  });

  it("renders warning amber state when consumption is at or above 80%", () => {
    const wrapper = mount(BudgetProgressBar, {
      props: {
        budgetUsd: 10.0,
        consumedUsd: 8.5,
      },
    });

    const fill = wrapper.find(".budget-progress-fill");
    expect(fill.classes()).toContain("budget-progress-fill--warning");
    expect(fill.classes()).not.toContain("budget-progress-fill--exhausted");
    expect(wrapper.text()).toContain("85%");
  });

  it("renders exhausted red state when consumption is 100% or isExhausted is true", () => {
    const wrapper = mount(BudgetProgressBar, {
      props: {
        budgetUsd: 5.0,
        consumedUsd: 5.0,
        isExhausted: true,
      },
    });

    const fill = wrapper.find(".budget-progress-fill");
    expect(fill.classes()).toContain("budget-progress-fill--exhausted");
    expect(wrapper.text()).toContain("100%");
  });

  it("clamps percentage between 0 and 100", () => {
    const wrapper = mount(BudgetProgressBar, {
      props: {
        budgetUsd: 2.0,
        consumedUsd: 3.5,
      },
    });

    expect(wrapper.find(".budget-progress-track").attributes("aria-valuenow")).toBe(
      "100",
    );
  });
});
