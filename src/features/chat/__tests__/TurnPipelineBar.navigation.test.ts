import { beforeEach, describe, expect, it, vi } from "vitest";
import { computed } from "vue";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TurnPipelineBar from "../TurnPipelineBar.vue";
import { useUiStore } from "@/shared/store/ui";

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
