import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import TaskBudgetBadge from "../TaskBudgetBadge.vue";
import IncreaseBudgetModal from "../IncreaseBudgetModal.vue";
import { useTaskBudget } from "../useTaskBudget";
import * as httpModule from "@/shared/api/http";

vi.mock("@/shared/api/http", () => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
  }),
}));

const BUDGET_PAYLOAD = {
  budget_usd: 10,
  consumed_usd: 4,
  is_warning: false,
  is_exhausted: false,
};

describe("TaskBudgetBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskBudget().clear();
  });

  it("marks the badge stale when the poll starts failing", async () => {
    vi.mocked(httpModule.httpGet).mockResolvedValueOnce(BUDGET_PAYLOAD);
    const wrapper = mount(TaskBudgetBadge, { props: { taskId: "task-1" } });
    await flushPromises();

    expect(wrapper.find(".task-budget-badge").exists()).toBe(true);
    expect(wrapper.find(".task-budget-badge--stale").exists()).toBe(false);
    expect(wrapper.text()).toContain("$4.00 / $10.00");

    vi.mocked(httpModule.httpGet).mockRejectedValueOnce(new Error("gateway down"));
    await useTaskBudget().refresh("task-1");
    await flushPromises();

    // The cost is still the last known one — say so instead of pretending.
    expect(wrapper.find(".task-budget-badge--stale").exists()).toBe(true);
    expect(wrapper.find(".task-budget-badge").attributes("title")).toContain(
      "gateway down",
    );
  });
});

describe("IncreaseBudgetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskBudget().clear();
  });

  it("shows the real backend error instead of a hardcoded English sentence", async () => {
    vi.mocked(httpModule.httpPost).mockRejectedValue(new Error("task already closed"));

    const wrapper = mount(IncreaseBudgetModal, {
      props: { visible: true, taskId: "task-1" },
    });

    await wrapper.findAll(".budget-btn--quick")[0].trigger("click");
    await flushPromises();

    const error = wrapper.find(".budget-modal__error");
    expect(error.exists()).toBe(true);
    expect(error.text()).toContain("task already closed");
    expect(error.text()).not.toContain("Failed to update budget");
    expect(wrapper.emitted("increased")).toBeFalsy();
  });

  it("closes on Escape without needing a click inside first", async () => {
    const wrapper = mount(IncreaseBudgetModal, {
      props: { visible: true, taskId: "task-1" },
      attachTo: document.body,
    });
    await flushPromises();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();

    expect(wrapper.emitted("close")).toBeTruthy();
    wrapper.unmount();
  });

  it("gives the close button an accessible name", () => {
    const wrapper = mount(IncreaseBudgetModal, {
      props: { visible: true, taskId: "task-1" },
    });
    expect(wrapper.find(".budget-modal__close").attributes("aria-label")).toBe(
      "common.close",
    );
  });
});
