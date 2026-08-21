import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const getConversation = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/endpoints/conversation", () => ({
  getConversation,
}));

import ConversationPanel from "@/widgets/task-panel/ConversationPanel.vue";

describe("ConversationPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    getConversation.mockReset();
  });

  it("shows a hint when no task is selected", async () => {
    const wrapper = mount(ConversationPanel, { props: { taskId: null } });
    await flushPromises();
    expect(getConversation).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("no task id");
  });

  it("renders the fetched conversation messages", async () => {
    getConversation.mockResolvedValue({
      task_id: "task-1",
      shared_history_enabled: true,
      messages: [
        {
          id: "m1",
          task_id: "task-1",
          role: "user",
          content: "Build a login page",
          created_at: "2026-06-11T19:30:00Z",
          metadata: {},
        },
        {
          id: "m2",
          task_id: "task-1",
          role: "assistant",
          content: "On it.",
          created_at: "2026-06-11T19:31:00Z",
          metadata: {},
        },
      ],
    });
    const wrapper = mount(ConversationPanel, { props: { taskId: "task-1" } });
    await flushPromises();
    expect(getConversation).toHaveBeenCalledWith("task-1", 200);
    expect(wrapper.text()).toContain("Build a login page");
    expect(wrapper.text()).toContain("On it.");
    expect(wrapper.findAll(".conversation-panel__msg")).toHaveLength(2);
  });

  it("surfaces errors instead of crashing", async () => {
    getConversation.mockRejectedValue(new Error("boom"));
    const wrapper = mount(ConversationPanel, { props: { taskId: "task-1" } });
    await flushPromises();
    expect(wrapper.text()).toContain("boom");
  });
});
