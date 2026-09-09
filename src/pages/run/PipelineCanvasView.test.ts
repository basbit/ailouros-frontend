import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineCanvasView from "./PipelineCanvasView.vue";
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

vi.mock("@vue-flow/core", () => ({
  VueFlow: {
    name: "VueFlow",
    props: ["nodes", "edges"],
    template: `
      <div class="mock-vue-flow">
        <slot name="default" />
        <div v-for="node in nodes" :key="node.id" class="mock-node">
          <slot name="node-run" :data="node.data" />
        </div>
      </div>
    `,
  },
}));

vi.mock("@vue-flow/background", () => ({
  Background: { name: "Background", template: "<div />" },
}));
vi.mock("@vue-flow/minimap", () => ({
  MiniMap: { name: "MiniMap", template: "<div />" },
}));
vi.mock("@vue-flow/controls", () => ({
  Controls: { name: "Controls", template: "<div />" },
}));

describe("PipelineCanvasView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
  });

  it("renders 2D canvas with active runs as nodes", () => {
    const ui = useUiStore();
    ui.taskId = "task-canvas-1";
    ui.taskScenarioTitle = "Compiler Swarm";
    ui.activeRunIds = ["task-canvas-1", "task-canvas-2"];

    const wrapper = mount(PipelineCanvasView);

    expect(wrapper.text()).toContain("pipelineCard.parallelPipes (2D Canvas)");
    expect(wrapper.text()).toContain("2 nodes");
    const cards = wrapper.findAllComponents({ name: "PipelineRunCard" });
    expect(cards.length).toBe(2);
  });

  it("renders remote peer cursors on canvas", () => {
    const wrapper = mount(PipelineCanvasView, {
      props: {
        remotePeers: [
          {
            id: "peer-arch",
            name: "Architect Sophia",
            color: "#8b5cf6",
            x: 120,
            y: 250,
          },
        ],
      },
    });

    expect(wrapper.text()).toContain("Architect Sophia");
    const cursor = wrapper.find(".remote-cursor");
    expect(cursor.exists()).toBe(true);
    expect(cursor.attributes("style")).toContain("120px");
    expect(cursor.attributes("style")).toContain("250px");
  });

  it("opens BrowserViewportModal when open-browser is emitted by a card", async () => {
    const ui = useUiStore();
    ui.taskId = "task-inspect-browser";
    ui.activeRunIds = ["task-inspect-browser"];

    const wrapper = mount(PipelineCanvasView);
    const card = wrapper.findComponent({ name: "PipelineRunCard" });
    expect(card.exists()).toBe(true);

    expect(wrapper.findComponent({ name: "BrowserViewportModal" }).exists()).toBe(
      false,
    );

    card.vm.$emit("open-browser", "task-inspect-browser");
    await wrapper.vm.$nextTick();

    const modal = wrapper.findComponent({ name: "BrowserViewportModal" });
    expect(modal.exists()).toBe(true);
    expect(modal.props("taskId")).toBe("task-inspect-browser");
  });
});
