import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import BrowserViewportModal from "./BrowserViewportModal.vue";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("./LiveBrowserViewport.vue", () => ({
  default: {
    name: "LiveBrowserViewport",
    props: ["taskId"],
    template: '<div class="mock-live-browser-viewport">{{ taskId }}</div>',
  },
}));

describe("BrowserViewportModal", () => {
  it("renders taskId in header and inside viewport", () => {
    const wrapper = mount(BrowserViewportModal, {
      props: {
        taskId: "task-modal-777",
      },
    });

    expect(wrapper.text()).toContain("task-modal-777");
    expect(wrapper.find(".mock-live-browser-viewport").exists()).toBe(true);
  });

  it("emits close event when close button or backdrop is clicked", async () => {
    const wrapper = mount(BrowserViewportModal, {
      props: {
        taskId: "task-modal-777",
      },
    });

    // Close button
    await wrapper.find(".browser-viewport-modal__close-btn").trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();

    // Backdrop click
    await wrapper.find(".browser-viewport-modal-backdrop").trigger("click");
    expect(wrapper.emitted("close")?.length).toBe(2);
  });

  it("emits close event on Escape key", () => {
    const wrapper = mount(BrowserViewportModal, {
      props: {
        taskId: "task-modal-777",
      },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("close")).toBeTruthy();
  });
});
