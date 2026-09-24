import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, reactive, ref } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

import { APP_SETTINGS_KEY } from "@/app/providers/settingsContext";
import type { AppSettings } from "@/app/providers/settingsContext";
import { useUiStore } from "@/shared/store/ui";
import type { PhaseGate } from "@/shared/model/phase-gate-types";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const thread = await vi.hoisted(async () => {
  const { ref: hoistedRef } = await import("vue");
  return {
    activeThread: hoistedRef<{ id: string; turns: Record<string, unknown>[] } | null>(null),
    addTurn: vi.fn(),
    patchTurn: vi.fn(),
  };
});

vi.mock("@/features/conversation-thread/useConversationThread", () => ({
  useConversationThread: () => ({
    threadsList: ref([]),
    activeThread: thread.activeThread,
    loadingThreads: ref(false),
    loadThreads: vi.fn().mockResolvedValue(undefined),
    selectThread: vi.fn().mockResolvedValue(undefined),
    startNewThread: vi.fn().mockResolvedValue({ id: "th-1" }),
    removeThread: vi.fn().mockResolvedValue(undefined),
    addTurn: thread.addTurn,
    patchTurn: thread.patchTurn,
  }),
}));

const gates = await vi.hoisted(async () => {
  const { ref: hoistedRef } = await import("vue");
  return {
    pendingGates: hoistedRef<PhaseGate[]>([]),
    decidingGateId: hoistedRef<string | null>(null),
  };
});

vi.mock("@/entities/phase-gate", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/phase-gate")>();
  return {
    ...actual,
    usePhaseGatePolling: vi.fn(),
    usePhaseGates: () => ({
      pendingGates: gates.pendingGates,
      decidingGateId: gates.decidingGateId,
      loading: ref(false),
      lastError: ref(null),
      visible: ref(false),
      refresh: vi.fn(),
      decide: vi.fn(),
      clear: vi.fn(),
    }),
  };
});

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

const runner = vi.hoisted(() => ({
  onStartRun: vi.fn().mockResolvedValue(undefined),
  onStopRun: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/features/swarm-run/useSwarmRunStart", () => ({
  useSwarmRunStart: () => runner,
}));

const gateActions = vi.hoisted(() => ({
  onHumanResume: vi.fn().mockResolvedValue(true),
  onDecidePhaseGate: vi.fn().mockResolvedValue(true),
  onConfirmShell: vi.fn(),
  onConfirmManualShell: vi.fn(),
  onRetry: vi.fn(),
  onContinuePipeline: vi.fn(),
}));

vi.mock("@/features/swarm-run/useSwarmRunGateActions", () => ({
  useSwarmRunGateActions: () => gateActions,
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import ChatPage from "./ChatPage.vue";

// Pages left mounted keep their watchers alive on the shared thread ref and
// bleed into the next test's assertions.
const mounted: Array<{ unmount: () => void }> = [];
afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
});

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
        RunUnavailableBanner: true,
      },
    },
  });

  mounted.push(wrapper);
  return { wrapper, settings };
}

const TASK = "task-123";

function turn(overrides: Record<string, unknown>) {
  return {
    id: "turn-1",
    user_message: "build it",
    status: "running",
    task_id: TASK,
    attachments: [],
    image_attachments: [],
    ...overrides,
  };
}

function gate(overrides: Partial<PhaseGate> = {}): PhaseGate {
  return {
    gateId: "gate-1",
    scenario: "spec_driven_feature",
    phaseId: "spec",
    taskId: TASK,
    summary: "review the spec",
    acceptanceCriteria: ["criterion one"],
    decision: "pending",
    decidedBy: "",
    decidedAt: 0,
    rationale: "",
    createdAt: 0,
    ttlSeconds: 0,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  thread.activeThread.value = null;
  thread.addTurn.mockReset().mockResolvedValue({ turn: { id: "turn-new" } });
  thread.patchTurn.mockReset().mockResolvedValue(undefined);
  gates.pendingGates.value = [];
  gates.decidingGateId.value = null;
  gateActions.onHumanResume.mockClear();
  gateActions.onDecidePhaseGate.mockClear();
  gateActions.onConfirmShell.mockClear();
  runner.onStopRun.mockClear();
});

describe("ChatPage sidebar collapse toggle", () => {
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
  it("renders the library button and opens ScenarioPickerDialog on click", async () => {
    const { wrapper, settings } = mountChatPage();
    const libraryBtn = wrapper.find('[data-testid="chat-open-scenario-library"]');
    expect(libraryBtn.exists()).toBe(true);
    expect(libraryBtn.text()).toBe("runIdle.openLibrary");

    expect(wrapper.find('[data-testid="scenario-picker-dialog"]').exists()).toBe(false);
    await libraryBtn.trigger("click");
    expect(wrapper.find('[data-testid="scenario-picker-dialog"]').exists()).toBe(true);

    await wrapper.get('[data-testid="stub-pick-scenario"]').trigger("click");
    expect(settings.form.scenario_id).toBe("code_review");
    expect(settings.saveSettingsSoon).toHaveBeenCalled();
  });
});

describe("ChatPage — in-feed question card", () => {
  it("shows the card with the question when the live run asks the operator", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper } = mountChatPage({ workspace_root: "/tmp/game_1" });
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;
    ui.humanGateTitle = "Phase review required";
    await nextTick();

    const card = wrapper.get('[data-testid="chat-gate-prompt"]');
    expect(card.text()).toContain("Phase review required");
    expect(card.text()).toContain("chat.gatePromptHint");
  });

  it("provides an Approve button for human gate which resumes with 'Approved' when prompt is empty", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper } = mountChatPage({ workspace_root: "/tmp/game_1" });
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;
    ui.humanGateTitle = "Phase review required";
    await nextTick();

    const approveBtn = wrapper.find('[data-testid="chat-gate-human-approve"]');
    expect(approveBtn.exists()).toBe(true);

    await approveBtn.trigger("click");
    expect(gateActions.onHumanResume).toHaveBeenCalledWith("Approved");
  });

  it("does not show the card on a turn that belongs to a different run", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({ task_id: "task-other" })] };
    const { wrapper } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.humanGateVisible = true;
    await nextTick();

    expect(wrapper.find('[data-testid="chat-gate-prompt"]').exists()).toBe(false);
  });

  it("does not show the card on an unlinked old turn just because a gate is pending somewhere", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({ task_id: null, status: "completed" })] };
    const { wrapper } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = null;
    gates.pendingGates.value = [gate({ taskId: "task-other" })];
    await nextTick();

    expect(wrapper.find('[data-testid="chat-gate-prompt"]').exists()).toBe(false);
  });
});

describe("ChatPage — a phase gate is decided with a button, never from prose", () => {
  async function mountWithPhaseGate() {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const mounted = mountChatPage({ workspace_root: "/tmp/game_1" });
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    gates.pendingGates.value = [gate()];
    await nextTick();
    return { ...mounted, ui };
  }

  it("renders Approve / Request changes in the card", async () => {
    const { wrapper } = await mountWithPhaseGate();
    const card = wrapper.get('[data-testid="chat-gate-prompt"]');
    expect(card.find('[data-testid="phase-gate-approve"]').exists()).toBe(true);
    expect(card.find('[data-testid="phase-gate-request-changes"]').exists()).toBe(true);
    expect(card.text()).toContain("review the spec");
    expect(card.text()).toContain("criterion one");
  });

  it("sending 'no changes needed' does NOT decide the gate and does not hit human-resume; it shows a hint", async () => {
    const { wrapper, settings } = await mountWithPhaseGate();
    settings.form.prompt = "no changes needed, looks fine";
    await nextTick();

    await wrapper.get('[data-testid="chat-send"]').trigger("click");
    await nextTick();

    expect(gateActions.onDecidePhaseGate).not.toHaveBeenCalled();
    expect(gateActions.onHumanResume).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="chat-gate-inline-hint"]').text()).toBe(
      "chat.phaseGateChooseDecision",
    );
    expect(settings.form.prompt).toBe("no changes needed, looks fine");
  });

  it("Request changes sends the typed text as the rationale and clears the composer", async () => {
    const { wrapper, settings } = await mountWithPhaseGate();
    settings.form.prompt = "the error path is missing";
    await nextTick();

    await wrapper.get('[data-testid="phase-gate-request-changes"]').trigger("click");
    await nextTick();

    expect(gateActions.onDecidePhaseGate).toHaveBeenCalledWith(
      expect.objectContaining({ gateId: "gate-1" }),
      "changes_requested",
      "the error path is missing",
    );
    expect(settings.form.prompt).toBe("");
    expect(thread.addTurn).toHaveBeenCalledWith("the error path is missing", [], []);
  });

  it("keeps the rationale in the composer when the decision failed", async () => {
    gateActions.onDecidePhaseGate.mockResolvedValueOnce(false);
    const { wrapper, settings } = await mountWithPhaseGate();
    settings.form.prompt = "why";
    await nextTick();

    await wrapper.get('[data-testid="phase-gate-approve"]').trigger("click");
    await nextTick();

    expect(settings.form.prompt).toBe("why");
    expect(thread.addTurn).not.toHaveBeenCalled();
  });

  it("treats an awaiting_human pause labelled phase_gate as a phase gate even before the gate list arrives", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper, settings } = mountChatPage({ workspace_root: "/tmp/game_1" });
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    ui.taskHistory = [{ agent: "phase_gate", message: "Phase 'spec' needs human verification" }];
    settings.form.prompt = "approve";
    await nextTick();

    await wrapper.get('[data-testid="chat-send"]').trigger("click");

    expect(gateActions.onHumanResume).not.toHaveBeenCalled();
  });
});

describe("ChatPage — which gate the composer answers", () => {
  it("routes free text to human-resume only for a human gate", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper, settings } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;
    settings.form.prompt = "go ahead";
    await nextTick();

    await wrapper.get('[data-testid="chat-send"]').trigger("click");

    expect(gateActions.onHumanResume).toHaveBeenCalledWith("go ahead");
  });

  it("a shell gate is answered with Allow / Reject, not by sending text to human-resume", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper, settings } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_shell_confirm";
    ui.shellGateVisible = true;
    settings.form.prompt = "yes";
    await nextTick();

    await wrapper.get('[data-testid="chat-send"]').trigger("click");
    await nextTick();
    expect(gateActions.onHumanResume).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="chat-gate-inline-hint"]').text()).toBe(
      "chat.shellGateUseButtons",
    );

    await wrapper.get('[data-testid="chat-gate-shell-allow"]').trigger("click");
    expect(gateActions.onConfirmShell).toHaveBeenCalledWith(true);
  });
});

describe("ChatPage — stopping a gated run", () => {
  it("shows Stop while a gate is pending and the card offers Cancel run", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;
    await nextTick();

    expect(wrapper.find('[data-testid="chat-stop"]').exists()).toBe(true);
    await wrapper.get('[data-testid="chat-gate-cancel-run"]').trigger("click");
    await nextTick();

    expect(runner.onStopRun).toHaveBeenCalledTimes(1);
    expect(thread.patchTurn).toHaveBeenCalledWith("turn-1", {
      status: "failed",
      assistant_message: "chat.cancelledByUser",
    });
  });

  it("leaves the turn alone when the stop did not go through", async () => {
    runner.onStopRun.mockResolvedValueOnce(false);
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "running";
    await nextTick();

    await wrapper.get('[data-testid="chat-stop"]').trigger("click");
    await nextTick();

    expect(thread.patchTurn).not.toHaveBeenCalled();
  });
});

describe("ChatPage — a turn whose run is gone after a restart", () => {
  it("fails a turn persisted as running with no task id (the start never reached the backend)", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({ task_id: null })] };
    mountChatPage();
    await nextTick();

    expect(thread.patchTurn).toHaveBeenCalledWith("turn-1", {
      status: "failed",
      assistant_message: "chat.runUnavailableAfterRestart",
    });
  });

  it("fails the live turn when the server no longer knows its task", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    const { wrapper } = mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.runAvailability = "unavailable";
    await nextTick();

    expect(thread.patchTurn).toHaveBeenCalledWith("turn-1", {
      status: "failed",
      assistant_message: "chat.runUnavailableAfterRestart",
    });
    expect(wrapper.findComponent({ name: "RunUnavailableBanner" }).exists()).toBe(true);
    expect(wrapper.find('[data-testid="chat-send"]').exists()).toBe(true);
  });

  it("leaves a running turn alone while its task is resolved on the server", async () => {
    thread.activeThread.value = { id: "th", turns: [turn({})] };
    mountChatPage();
    const ui = useUiStore();
    ui.taskId = TASK;
    ui.taskStatus = "running";
    ui.runAvailability = "resolved";
    await nextTick();

    expect(thread.patchTurn.mock.calls).toEqual([]);
  });
});
