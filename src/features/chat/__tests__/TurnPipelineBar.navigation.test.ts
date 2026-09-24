import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TurnPipelineBar from "../TurnPipelineBar.vue";
import { useUiStore } from "@/shared/store/ui";
import { resetPhaseGates, usePhaseGates } from "@/entities/phase-gate";

vi.mock("@/shared/api/endpoints/phase-gates", () => ({
  listPendingPhaseGates: vi.fn(),
  decidePhaseGate: vi.fn(),
}));

const routerPush = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function makeSummary() {
  return {
    steps: computed(() => []),
    completedCount: computed(() => 1),
    failedCount: computed(() => 0),
    totalSteps: computed(() => 4),
    activeStep: computed(() => "cross_validate"),
    latestLog: computed(() => "cross_validate: still working"),
    logLines: computed(() => []),
    progressPct: computed(() => 25),
    status: computed(() => "running"),
    isRunning: computed(() => true),
  } as never;
}

describe("TurnPipelineBar — opening the run", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerPush.mockClear();
  });

  it("opens the history entry for the run when one exists", async () => {
    const ui = useUiStore();
    ui.historyList = [
      { id: "history-entry-1", taskId: "task-abc", status: "in_progress" },
    ] as never;

    const wrapper = mount(TurnPipelineBar, {
      props: { summary: makeSummary(), taskId: "task-abc" },
    });
    await wrapper.find("button").trigger("click");

    expect(routerPush).toHaveBeenCalledWith("/history/history-entry-1");
  });

  it("falls back to the task id when the run is not in history yet", async () => {
    const ui = useUiStore();
    ui.historyList = [] as never;

    const wrapper = mount(TurnPipelineBar, {
      props: { summary: makeSummary(), taskId: "task-not-listed" },
    });
    await wrapper.find("button").trigger("click");

    // HistoryDetailPage resolves either an entry id or a raw task id, so this
    // still lands on the pipeline rather than a dead route.
    expect(routerPush).toHaveBeenCalledWith("/history/task-not-listed");
  });

  it("does not navigate when the turn has no run linked to it", async () => {
    const wrapper = mount(TurnPipelineBar, {
      props: { summary: makeSummary(), taskId: null },
    });
    await wrapper.find("button").trigger("click");

    expect(routerPush).not.toHaveBeenCalled();
  });
});

describe("TurnPipelineBar — headline before the run reports running", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("says the pipeline is starting, not completed, while 0 steps are done and nothing runs yet", () => {
    const summary = {
      steps: computed(() => []),
      completedCount: computed(() => 0),
      failedCount: computed(() => 0),
      totalSteps: computed(() => 13),
      activeStep: computed(() => null),
      latestLog: computed(() => ""),
      logLines: computed(() => []),
      progressPct: computed(() => 0),
      status: computed(() => "pending"),
      isRunning: computed(() => false),
    } as never;
    const wrapper = mount(TurnPipelineBar, { props: { summary, taskId: null } });
    expect(wrapper.text()).toContain("chat.pipelineBar.idleTitle");
    expect(wrapper.text()).not.toContain("chat.pipelineBar.doneTitle");
  });
});

describe("TurnPipelineBar — a gate belongs to exactly one run", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetPhaseGates();
  });

  function finishedSummary() {
    return {
      steps: computed(() => []),
      completedCount: computed(() => 4),
      failedCount: computed(() => 0),
      totalSteps: computed(() => 4),
      activeStep: computed(() => null),
      latestLog: computed(() => ""),
      logLines: computed(() => []),
      progressPct: computed(() => 100),
      status: computed(() => "completed"),
      isRunning: computed(() => false),
    } as never;
  }

  async function withPendingGate(taskId: string) {
    const { listPendingPhaseGates } = await import("@/shared/api/endpoints/phase-gates");
    vi.mocked(listPendingPhaseGates).mockResolvedValue([
      {
        gateId: "g", scenario: "s", phaseId: "spec", taskId, summary: "", acceptanceCriteria: [],
        decision: "pending", decidedBy: "", decidedAt: 0, rationale: "", createdAt: 0, ttlSeconds: 0,
      },
    ]);
    await usePhaseGates().refresh("/tmp/w");
  }

  it("an unlinked old turn does not flip to 'gate' because some run has a gate pending", async () => {
    const ui = useUiStore();
    ui.taskId = "task-live";
    ui.humanGateVisible = true;
    await withPendingGate("task-live");

    const wrapper = mount(TurnPipelineBar, { props: { summary: finishedSummary(), taskId: null } });

    expect(wrapper.find(".turn-pipeline-bar__status--gate").exists()).toBe(false);
    expect(wrapper.find(".turn-pipeline-bar__status--completed").exists()).toBe(true);
  });

  it("a turn of another run does not show the live run's gate", async () => {
    const ui = useUiStore();
    ui.taskId = "task-live";
    await withPendingGate("task-live");

    const wrapper = mount(TurnPipelineBar, {
      props: { summary: finishedSummary(), taskId: "task-old" },
    });

    expect(wrapper.find(".turn-pipeline-bar__status--gate").exists()).toBe(false);
  });

  it("the turn whose run has the pending gate shows it, with an accessible name on the mark", async () => {
    const ui = useUiStore();
    ui.taskId = "task-live";
    await withPendingGate("task-live");

    const wrapper = mount(TurnPipelineBar, {
      props: { summary: finishedSummary(), taskId: "task-live" },
    });

    expect(wrapper.find(".turn-pipeline-bar__status--gate").exists()).toBe(true);
    expect(wrapper.get(".turn-pipeline-bar__icon").attributes("aria-label")).toBe(
      "chat.pipelineBar.status.gate",
    );
  });
});

describe("TurnPipelineBar — every gate pause reads as a gate", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    resetPhaseGates();
  });

  function summaryWithStatus(status: string) {
    return {
      steps: computed(() => []),
      completedCount: computed(() => 2),
      failedCount: computed(() => 0),
      totalSteps: computed(() => 4),
      activeStep: computed(() => "dev"),
      latestLog: computed(() => ""),
      logLines: computed(() => []),
      progressPct: computed(() => 50),
      status: computed(() => status),
      isRunning: computed(() => false),
    } as never;
  }

  it.each(["awaiting_human", "awaiting_shell_confirm", "awaiting_manual_shell"])(
    "shows %s as a gate, not as pending",
    (status) => {
      const wrapper = mount(TurnPipelineBar, {
        props: { summary: summaryWithStatus(status), taskId: "task-1" },
      });

      expect(wrapper.find(".turn-pipeline-bar__status--gate").exists()).toBe(true);
      expect(wrapper.text()).toContain("chat.pipelineBar.gateTitle");
    },
  );

  it("a running step is not a gate", () => {
    const wrapper = mount(TurnPipelineBar, {
      props: { summary: summaryWithStatus("in_progress"), taskId: "task-1" },
    });

    expect(wrapper.find(".turn-pipeline-bar__status--gate").exists()).toBe(false);
  });
});
