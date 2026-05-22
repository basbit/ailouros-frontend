import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";

import ConversationHistoryPanel from "./ConversationHistoryPanel.vue";
import type { ConversationMessage } from "./conversation-types";

const MESSAGES: ConversationMessage[] = [
  {
    id: "m1",
    task_id: "t1",
    role: "user",
    content: "First request",
    created_at: "2026-05-14T10:00:00Z",
  },
  {
    id: "m2",
    task_id: "t1",
    role: "assistant",
    content: "First reply",
    created_at: "2026-05-14T10:00:05Z",
  },
];

describe("ConversationHistoryPanel", () => {
  it("renders messages with role and timestamp", () => {
    const wrapper = mount(ConversationHistoryPanel, {
      props: { messages: MESSAGES },
    });
    const items = wrapper.findAll(".conv-history__item");
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain("user");
    expect(items[0].text()).toContain("First request");
    expect(items[1].text()).toContain("assistant");
  });

  it("shows loading hint when loading is true", () => {
    const wrapper = mount(ConversationHistoryPanel, {
      props: { messages: [], loading: true },
    });
    expect(wrapper.text()).toContain("Loading");
  });

  it("shows notImplemented hint when backend returns 404", () => {
    const wrapper = mount(ConversationHistoryPanel, {
      props: { messages: [], notImplemented: true },
    });
    expect(wrapper.text()).toContain("not available");
  });

  it("shows disabled hint when shared history is off and feature flag is false", () => {
    const wrapper = mount(ConversationHistoryPanel, {
      props: { messages: [], sharedHistoryEnabled: false },
    });
    expect(wrapper.text()).toContain("Shared history is disabled");
  });

  it("shows error when error prop is non-null", () => {
    const wrapper = mount(ConversationHistoryPanel, {
      props: { messages: [], error: "boom" },
    });
    expect(wrapper.text()).toContain("boom");
  });

  it("renders shared-history flag in all three states", () => {
    const unknown = mount(ConversationHistoryPanel, {
      props: { messages: [], sharedHistoryEnabled: null },
    });
    expect(unknown.text()).toContain("shared history: ?");

    const on = mount(ConversationHistoryPanel, {
      props: { messages: [], sharedHistoryEnabled: true },
    });
    expect(on.text()).toContain("shared history: on");

    const off = mount(ConversationHistoryPanel, {
      props: { messages: [], sharedHistoryEnabled: false },
    });
    expect(off.text()).toContain("shared history: off");
  });
});
