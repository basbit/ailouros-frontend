/**
 * A paused run has to say what it is waiting for, in History too.
 *
 * The awaiting banner took its text from the `ui` store, which only the live
 * run of the current browser session fills in. Open History for a run that
 * paused — after a reload, in a second tab, or simply later — and the banner
 * said "Action required" and nothing else: the operator saw that something was
 * asked but never what.
 *
 * The backend already carries the question: `/v1/tasks/{id}` returns the pause
 * detail in `error`, read off the run's own pipeline.json.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h, provide, ref } from "vue";
import HistoryDetailPage from "../HistoryDetailPage.vue";
import { useSettings } from "@/app/providers/useSettings";
import { useSwarmRunController, SWARM_RUN_CONTROLLER_KEY } from "@/features/swarm-run";
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import { useProjectFormActions, PROJECT_FORM_ACTIONS_KEY } from "@/entities/project-form";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { useUiStore } from "@/shared/store/ui";
import { isTaskResumable } from "@/shared/lib/task-status";

const {
  getLegacyTaskSnapshot,
  postHumanResumeStreamMock,
  postConfirmShellMock,
  postConfirmManualShellMock,
  cancelTaskMock,
} = vi.hoisted(() => ({
  getLegacyTaskSnapshot: vi.fn(),
  postHumanResumeStreamMock: vi.fn(),
  postConfirmShellMock: vi.fn(),
  postConfirmManualShellMock: vi.fn(),
  cancelTaskMock: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/tasks", () => ({
  getLegacyTaskSnapshot: (taskId: string) => getLegacyTaskSnapshot(taskId),
}));

vi.mock("@/shared/api/endpoints/task-gates", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/endpoints/task-gates")>();
  return {
    ...mod,
    postHumanResumeStream: (...args: unknown[]) => postHumanResumeStreamMock(...args),
    postConfirmShell: (...args: unknown[]) => postConfirmShellMock(...args),
    postConfirmManualShell: (...args: unknown[]) => postConfirmManualShellMock(...args),
  };
});

vi.mock("@/shared/api/endpoints/tasks-runtime", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/shared/api/endpoints/tasks-runtime")>();
  return {
    ...mod,
    cancelTask: (taskId: string) => cancelTaskMock(taskId),
  };
});

vi.mock("@/shared/api/http", () => ({
  httpGet: vi.fn().mockResolvedValue({ can_resume: false }),
}));

vi.mock("@/features/system-health/useSystemHealth", () => ({
  useSystemHealth: () => ({
    status: ref("healthy"),
    subsystems: ref([]),
    loading: ref(false),
    error: ref(null),
    notImplemented: ref(false),
    lastUpdatedAt: ref(null),
    reload: vi.fn().mockResolvedValue(undefined),
  }),
}));

// The real pause of run 2e67b59d, as its pipeline.json recorded it.
const TRACER_QUESTION =
  "Tracer story 'audit' went through all layers. Review the epic plan before the remaining 4 story(ies) run.";

function makeHost(runId: string) {
  return defineComponent({
    setup() {
      const settings = useSettings();
      const controller = useSwarmRunController(settings);
      const globalSettings = useGlobalSettings();
      const projectForm = useProjectFormActions(settings, {
        syncTaskFromServer: controller.syncTaskFromServer,
        sendWsSubscribe: controller.sendWsSubscribe,
      });
      provide(APP_SETTINGS_KEY, settings);
      provide(SWARM_RUN_CONTROLLER_KEY, controller);
      provide(GLOBAL_SETTINGS_KEY, globalSettings);
      provide(PROJECT_FORM_ACTIONS_KEY, projectForm);
    },
    render() {
      return h(HistoryDetailPage, { runId });
    },
  });
}

async function mountPausedRun(snapshot: Record<string, unknown>) {
  getLegacyTaskSnapshot.mockResolvedValue(snapshot);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/history/:runId", component: { template: "<div />" }, props: true }],
  });
  await router.replace(`/history/${snapshot.task_id}`);
  const wrapper = mount(makeHost(String(snapshot.task_id)), {
    global: { plugins: [router] },
  });
  await wrapper.vm.$nextTick();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await wrapper.vm.$nextTick();
  return wrapper;
}

describe("HistoryDetailPage — a paused run says what it is waiting for", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    getLegacyTaskSnapshot.mockReset();
    postHumanResumeStreamMock.mockReset().mockResolvedValue(new Response(""));
    postConfirmShellMock.mockReset().mockResolvedValue({ ok: true });
    postConfirmManualShellMock.mockReset().mockResolvedValue({ ok: true });
    cancelTaskMock.mockReset().mockResolvedValue({ task_id: "t1", status: "cancelled", was_active: true });
  });

  it("shows the question the run paused on, not just that one exists", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-1",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    expect(wrapper.text()).toContain("Tracer story 'audit' went through all layers");
    wrapper.unmount();
  });

  it("names the step that is waiting, so the operator knows who asked", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-2",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    const label = wrapper.get(".history-detail-page__awaiting-step");
    expect(label.text()).toBe("dev");
    wrapper.unmount();
  });

  it("never shows the live run's question on another run's page", async () => {
    const ui = useUiStore();
    ui.taskId = "live-run-B";
    ui.humanGateVisible = true;
    ui.humanGateTitle = "Question that belongs to run B";
    ui.manualShellReason = "Run B wants you to run make";
    const wrapper = await mountPausedRun({
      task_id: "paused-run-A",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    expect(wrapper.text()).not.toContain("Question that belongs to run B");
    expect(wrapper.text()).not.toContain("Run B wants you to run make");
    expect(wrapper.text()).toContain("Tracer story 'audit' went through all layers");
    wrapper.unmount();
  });

  // The list offered Resume for a shell-gate pause while the detail page hid
  // it: two separate status lists. They read the same one now.
  it.each(["awaiting_shell_confirm", "awaiting_manual_shell", "failed"])(
    "offers Resume for a %s run, exactly as the History list does",
    async (status) => {
      const wrapper = await mountPausedRun({
        task_id: `resumable-${status}`,
        status,
        prompt: "fix the game",
        error: "",
        pipeline_steps: ["dev"],
        history: [],
      });

      expect(wrapper.find(".history-detail-header__resume-btn").exists()).toBe(true);
      expect(isTaskResumable(status)).toBe(true);
      wrapper.unmount();
    },
  );

  it("hides Resume for a completed run, exactly as the History list does", async () => {
    const wrapper = await mountPausedRun({
      task_id: "done-run",
      status: "completed",
      prompt: "fix the game",
      error: "",
      pipeline_steps: ["dev"],
      history: [],
    });

    expect(wrapper.find(".history-detail-header__resume-btn").exists()).toBe(false);
    expect(isTaskResumable("completed")).toBe(false);
    wrapper.unmount();
  });

  it("does not present a failed run's error as a question", async () => {
    const wrapper = await mountPausedRun({
      task_id: "failed-run",
      status: "failed",
      prompt: "fix the game",
      error: "MCP tool binding failed: exhausted its tool-call budget",
      failed_step: "problem_spotter",
      pipeline_steps: ["problem_spotter"],
      history: [],
    });

    expect(wrapper.text()).not.toContain("history.questionBadge");
    expect(wrapper.text()).not.toContain("Action needed");
    wrapper.unmount();
  });

  it("renders interactive human gate controls (textarea, approve, submit with changes, cancel) and approves", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-human",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    const textarea = wrapper.find('[data-testid="history-gate-feedback"]');
    const approveBtn = wrapper.find('[data-testid="history-gate-approve"]');
    const submitBtn = wrapper.find('[data-testid="history-gate-submit-changes"]');
    const cancelBtn = wrapper.find('[data-testid="history-gate-cancel"]');

    expect(textarea.exists()).toBe(true);
    expect(approveBtn.exists()).toBe(true);
    expect(cancelBtn.exists()).toBe(true);

    await approveBtn.trigger("click");
    await flushPromises();
    expect(postHumanResumeStreamMock).toHaveBeenCalledWith(
      "paused-run-human",
      "Approved",
      expect.anything(),
    );
    wrapper.unmount();
  });

  it("submits custom feedback changes when operator provides notes", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-changes",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    const textarea = wrapper.find('textarea[data-testid="history-gate-feedback"]');
    await textarea.setValue("Please rewrite story 2 without redux");
    await wrapper.vm.$nextTick();
    const submitBtn = wrapper.find('[data-testid="history-gate-submit-changes"]');
    expect(submitBtn.exists()).toBe(true);
    await submitBtn.trigger("click");
    await flushPromises();

    expect(postHumanResumeStreamMock).toHaveBeenCalledWith(
      "paused-run-changes",
      "Please rewrite story 2 without redux",
      expect.anything(),
    );
    wrapper.unmount();
  });

  it("allows shell gate execution when operator confirms", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-shell-allow",
      status: "awaiting_shell_confirm",
      prompt: "fix the game",
      error: "Execute `rm -rf /tmp/cache`",
      pipeline_steps: ["dev"],
      history: [],
    });

    const allowBtn = wrapper.find('[data-testid="history-gate-shell-allow"]');
    expect(allowBtn.exists()).toBe(true);
    await allowBtn.trigger("click");
    expect(postConfirmShellMock).toHaveBeenCalledWith("paused-run-shell-allow", true);
    wrapper.unmount();
  });

  it("rejects shell gate execution when operator rejects", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-shell-reject",
      status: "awaiting_shell_confirm",
      prompt: "fix the game",
      error: "Execute `rm -rf /tmp/cache`",
      pipeline_steps: ["dev"],
      history: [],
    });

    const rejectBtn = wrapper.find('[data-testid="history-gate-shell-reject"]');
    expect(rejectBtn.exists()).toBe(true);
    await rejectBtn.trigger("click");
    expect(postConfirmShellMock).toHaveBeenCalledWith("paused-run-shell-reject", false);
    wrapper.unmount();
  });

  it("confirms manual shell gate when operator finishes manual step", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-manual-done",
      status: "awaiting_manual_shell",
      prompt: "fix the game",
      error: "Install dependencies manually",
      pipeline_steps: ["dev"],
      history: [],
    });

    const doneBtn = wrapper.find('[data-testid="history-gate-manual-done"]');
    expect(doneBtn.exists()).toBe(true);
    await doneBtn.trigger("click");
    expect(postConfirmManualShellMock).toHaveBeenCalledWith("paused-run-manual-done", true);
    wrapper.unmount();
  });

  it("cancels manual shell gate when operator cancels", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-manual-cancel",
      status: "awaiting_manual_shell",
      prompt: "fix the game",
      error: "Install dependencies manually",
      pipeline_steps: ["dev"],
      history: [],
    });

    const cancelBtn = wrapper.find('[data-testid="history-gate-manual-cancel"]');
    expect(cancelBtn.exists()).toBe(true);
    await cancelBtn.trigger("click");
    expect(postConfirmManualShellMock).toHaveBeenCalledWith("paused-run-manual-cancel", false);
    wrapper.unmount();
  });

  it("allows cancelling the awaiting task directly from the gate card", async () => {
    const wrapper = await mountPausedRun({
      task_id: "paused-run-cancel",
      status: "awaiting_human",
      prompt: "fix the game",
      error: TRACER_QUESTION,
      human_approval_step: "dev",
      resume_from_step: "human_dev",
      pipeline_steps: ["dev"],
      history: [],
    });

    const cancelBtn = wrapper.find('[data-testid="history-gate-cancel"]');
    await cancelBtn.trigger("click");
    expect(cancelTaskMock).toHaveBeenCalledWith("paused-run-cancel");
    wrapper.unmount();
  });
});

