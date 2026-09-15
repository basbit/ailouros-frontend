import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive, ref } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import { APP_SETTINGS_KEY } from "@/app/providers/settingsContext";
import type { AppSettings } from "@/app/providers/settingsContext";
import { useUiStore } from "@/shared/store/ui";

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

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ChatPage from "./ChatPage.vue";

function mountChatPage(customSettings?: Partial<AppSettings["form"]>) {
  const settings = {
    form: reactive({
      prompt: "",
      workspace_root: "",
      attachments: [],
      image_attachments: [],
      scenario_id: "",
      favorite_scenarios: [],
      custom_scenarios: [],
      ...customSettings,
    }),
    saveSettingsSoon: vi.fn(),
  } as unknown as AppSettings;

  const wrapper = mount(ChatPage, {
    global: {
      provide: { [APP_SETTINGS_KEY as symbol]: settings },
      stubs: {
        AppHeaderContainer: true,
        PromptInput: true,
        ScenarioQuickLaunch: true,
        ScenarioPickerDialog: {
          name: "ScenarioPickerDialog",
          props: ["open", "modelValue", "favorites", "customScenarios"],
          emits: ["update:open", "update:modelValue", "toggle-favorite", "open-settings"],
          template: '<div v-if="open" data-testid="scenario-picker-dialog"><button data-testid="stub-pick-scenario" @click="$emit(\'update:modelValue\', \'code_review\')">Pick</button></div>',
        },
        TurnPipelineBar: true,
        TaskGatesOverlay: true,
        PhaseGateCard: {
          name: "PhaseGateCard",
          props: ["workspaceRoot", "taskId"],
          template: '<div data-testid="phase-gate-card" :data-workspace="workspaceRoot" :data-task="taskId ?? \'\'" />',
        },
      },
    },
  });

  return { wrapper, settings };
}

describe("ChatPage sidebar collapse toggle", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("collapsing the sidebar leaves the toggle as the only control in the header, so it stays inside the 48px rail", async () => {
    const { wrapper } = mountChatPage();
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
    const { wrapper } = mountChatPage();
    const sidebar = wrapper.get('[data-testid="chat-sidebar"]');

    await wrapper.get('[data-testid="chat-sidebar-toggle"]').trigger("click");
    expect(sidebar.classes()).toContain("chat-sidebar--collapsed");

    await wrapper.get('[data-testid="chat-sidebar-toggle"]').trigger("click");
    expect(sidebar.classes()).not.toContain("chat-sidebar--collapsed");
    expect(wrapper.find(".chat-sidebar__new-btn").exists()).toBe(true);
  });
});

describe("ChatPage scenario library button", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renders the library button and opens ScenarioPickerDialog on click", async () => {
    const { wrapper, settings } = mountChatPage();
    const libraryBtn = wrapper.find('[data-testid="chat-open-scenario-library"]');
    expect(libraryBtn.exists()).toBe(true);
    expect(libraryBtn.text()).toBe("runIdle.openLibrary");

    // Initially the dialog is closed
    expect(wrapper.find('[data-testid="scenario-picker-dialog"]').exists()).toBe(false);

    // Click library button
    await libraryBtn.trigger("click");

    // Dialog is now open
    expect(wrapper.find('[data-testid="scenario-picker-dialog"]').exists()).toBe(true);

    // Selecting a scenario updates settings
    await wrapper.get('[data-testid="stub-pick-scenario"]').trigger("click");
    expect(settings.form.scenario_id).toBe("code_review");
    expect(settings.saveSettingsSoon).toHaveBeenCalled();
  });
});


describe("ChatPage phase gates", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("mounts the phase gate card for the current workspace so a pending gate is visible from chat", async () => {
    const { wrapper } = mountChatPage({ workspace_root: "/tmp/game_1" });
    const ui = useUiStore();
    ui.taskId = "task-123";
    await nextTick();

    const card = wrapper.get('[data-testid="phase-gate-card"]');
    expect(card.attributes("data-workspace")).toBe("/tmp/game_1");
    expect(card.attributes("data-task")).toBe("task-123");
  });

  it("does not mount the card without a workspace (no gate can exist)", () => {
    const { wrapper } = mountChatPage({ workspace_root: "" });
    expect(wrapper.find('[data-testid="phase-gate-card"]').exists()).toBe(false);
  });
});
