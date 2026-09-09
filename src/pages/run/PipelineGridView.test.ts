import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineGridView from "./PipelineGridView.vue";
import { useUiStore } from "@/shared/store/ui";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const mockPush = vi.fn();
vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("PipelineGridView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
  });

  it("renders run cards when active runs exist", () => {
    const ui = useUiStore();
    ui.taskId = "task-grid-1";
    ui.taskScenarioTitle = "Full Stack Refactor";
    ui.activeRunIds = ["task-grid-1", "task-grid-2"];

    const wrapper = mount(PipelineGridView);

    expect(wrapper.text()).toContain("pipelineCard.parallelPipes");
    const cards = wrapper.findAllComponents({ name: "PipelineRunCard" });
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it("filters runs by search query", async () => {
    const ui = useUiStore();
    ui.taskId = "task-alpha";
    ui.activeRunIds = ["task-alpha", "task-beta"];

    const wrapper = mount(PipelineGridView);
    const searchInput = wrapper.find("input[type='search']");

    await searchInput.setValue("alpha");
    const cards = wrapper.findAllComponents({ name: "PipelineRunCard" });
    expect(cards.length).toBe(1);
    expect(cards[0].props("taskId")).toBe("task-alpha");
  });
});
