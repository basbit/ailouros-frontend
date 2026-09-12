import { beforeEach, describe, expect, it, vi } from "vitest";
import { reactive, ref } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import { APP_SETTINGS_KEY } from "@/app/providers/settingsContext";
import type { AppSettings } from "@/app/providers/settingsContext";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/features/conversation-thread/useConversationThread", () => ({
  useConversationThread: () => ({
    threadsList: ref([]),
    activeThread: ref(null),
    loadingThreads: ref(false),
    loadThreads: vi.fn().mockResolvedValue(undefined),
    selectThread: vi.fn().mockResolvedValue(undefined),
    startNewThread: vi.fn().mockResolvedValue({ id: "th-1" }),
    removeThread: vi.fn().mockResolvedValue(undefined),
    addTurn: vi.fn(),
    patchTurn: vi.fn(),
  }),
}));

vi.mock("@/features/swarm-run", () => ({
  useInjectedSwarmRunController: () => ({ sendWsSubscribe: vi.fn() }),
}));

vi.mock("@/features/swarm-run/useSwarmRunState", () => ({
  useSwarmRunState: () => ({ currentPipelineSteps: ref([]) }),
}));

vi.mock("@/features/swarm-run/useSwarmRunTickHandler", () => ({
  useSwarmRunTickHandler: () => ({}),
}));

vi.mock("@/features/swarm-run/useSwarmRunPreflight", () => ({
  useSwarmRunPreflight: () => ({}),
}));

vi.mock("@/features/swarm-run/useSwarmRunStart", () => ({
  useSwarmRunStart: () => ({ onStartRun: vi.fn() }),
}));

vi.mock("@/features/swarm-run/useSwarmRunGateActions", () => ({
  useSwarmRunGateActions: () => ({
    onHumanResume: vi.fn(),
    onConfirmShell: vi.fn(),
    onConfirmManualShell: vi.fn(),
    onRetry: vi.fn(),
    onContinuePipeline: vi.fn(),
  }),
}));

import ChatPage from "./ChatPage.vue";

function mountChatPage() {
  const settings = {
    form: reactive({
      prompt: "",
      workspace_root: "",
      attachments: [],
      image_attachments: [],
      scenario_id: "",
      favorite_scenarios: [],
      custom_scenarios: [],
    }),
    saveSettingsSoon: vi.fn(),
  } as unknown as AppSettings;

  return mount(ChatPage, {
    global: {
      provide: { [APP_SETTINGS_KEY as symbol]: settings },
      stubs: {
        AppHeaderContainer: true,
        PromptInput: true,
        ScenarioQuickLaunch: true,
        TurnPipelineBar: true,
        TaskGatesOverlay: true,
      },
    },
  });
}

describe("ChatPage sidebar collapse toggle", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("collapsing the sidebar leaves the toggle as the only control in the header, so it stays inside the 48px rail", async () => {
    const wrapper = mountChatPage();
    const toggle = wrapper.get('[data-testid="chat-sidebar-toggle"]');

    await toggle.trigger("click");

    const header = wrapper.get(".chat-sidebar__header");
    // The collapsed rail is 48px wide. Anything else laid out in the header row
    // pushes the toggle past that edge, where .chat-feed swallows the click and
    // the sidebar can never be re-expanded.
    expect(header.findAll("button")).toHaveLength(1);
    expect(header.find(".chat-sidebar__new-btn").exists()).toBe(false);
  });

  it("clicking the toggle twice collapses and then re-expands the sidebar", async () => {
    const wrapper = mountChatPage();
    const sidebar = wrapper.get('[data-testid="chat-sidebar"]');

    await wrapper.get('[data-testid="chat-sidebar-toggle"]').trigger("click");
    expect(sidebar.classes()).toContain("chat-sidebar--collapsed");

    await wrapper.get('[data-testid="chat-sidebar-toggle"]').trigger("click");
    expect(sidebar.classes()).not.toContain("chat-sidebar--collapsed");
    expect(wrapper.find(".chat-sidebar__new-btn").exists()).toBe(true);
  });
});
