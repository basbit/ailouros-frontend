import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineGridView from "./PipelineGridView.vue";
import { useUiStore } from "@/shared/store/ui";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
  }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/shared/api/endpoints/task-gates", () => ({
  postConfirmHuman: vi.fn().mockResolvedValue(undefined),
}));

class MockWebSocket {
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public url: string) {}
  send(): void {}
  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

function seedBackgroundGateRun(): ReturnType<typeof useUiStore> {
  const ui = useUiStore();
  ui.taskId = "task-foreground";
  ui.taskStatus = "running";
  ui.activeRunIds = ["task-foreground", "task-background"];
  ui.historyList = [
    {
      id: "h1",
      at: 1,
      prompt: "Background run",
      agent_config: {},
      pipeline_steps: ["plan", "build_feature", "review_qa"],
      taskId: "task-background",
      status: "awaiting_human",
    },
  ];
  return ui;
}

describe("PipelineGridView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps a resolved gate resolved after the store ticks again", async () => {
    const ui = seedBackgroundGateRun();
    const wrapper = mount(PipelineGridView);
    await flushPromises();

    const backgroundCard = wrapper
      .findAllComponents({ name: "PipelineRunCard" })
      .find((card) => card.props("taskId") === "task-background");
    expect(backgroundCard).toBeDefined();
    expect(backgroundCard?.props("status")).toBe("awaiting_human");

    backgroundCard?.vm.$emit("gate-resolved", "task-background", true);
    await flushPromises();

    // The run list is a computed rebuilt from the store; the old code mutated
    // the computed's own item and lost the resolution on the next tick.
    ui.taskStatus = "in_progress";
    await flushPromises();

    const afterTick = wrapper
      .findAllComponents({ name: "PipelineRunCard" })
      .find((card) => card.props("taskId") === "task-background");
    expect(afterTick?.props("status")).toBe("in_progress");
  });

  it("drives each card from the run's own pipeline steps", async () => {
    seedBackgroundGateRun();
    const wrapper = mount(PipelineGridView);
    await flushPromises();

    const backgroundCard = wrapper
      .findAllComponents({ name: "PipelineRunCard" })
      .find((card) => card.props("taskId") === "task-background");
    expect(backgroundCard?.props("steps")).toEqual([
      "plan",
      "build_feature",
      "review_qa",
    ]);
  });
});
