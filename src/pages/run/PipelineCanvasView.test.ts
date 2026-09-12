import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PipelineCanvasView from "./PipelineCanvasView.vue";
import { useUiStore } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";

vi.mock("@/shared/api/ws-ticket", () => ({
  fetchWebSocketTicket: async () => "test-ticket",
}));

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
  Background: { name: "Background", props: ["gap", "color"], template: "<div />" },
}));
vi.mock("@vue-flow/minimap", () => ({
  MiniMap: { name: "MiniMap", template: "<div />" },
}));
vi.mock("@vue-flow/controls", () => ({
  Controls: { name: "Controls", template: "<div />" },
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(): void {}

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

function pushPeers(peers: unknown[]): void {
  const socket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
  socket?.onmessage?.({ data: JSON.stringify({ type: "peers", peers }) });
}

describe("PipelineCanvasView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockPush.mockClear();
    // The coworking socket is a per-tab singleton, so it is deliberately NOT
    // reset between tests — that is the behaviour under test.
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    pushPeers([]);
    vi.unstubAllGlobals();
  });

  it("renders 2D canvas with active runs as nodes", () => {
    const ui = useUiStore();
    ui.taskId = "task-canvas-1";
    ui.taskScenarioTitle = "Compiler Swarm";
    ui.activeRunIds = ["task-canvas-1", "task-canvas-2"];

    const wrapper = mount(PipelineCanvasView);

    expect(wrapper.text()).toContain(
      "pipelineCard.parallelPipes (runView.modes.canvas)",
    );
    expect(wrapper.text()).toContain("pipelineCanvas.nodeCount");
    const cards = wrapper.findAllComponents({ name: "PipelineRunCard" });
    expect(cards.length).toBe(2);
  });

  it("renders remote peer cursors from the live coworking session", async () => {
    const wrapper = mount(PipelineCanvasView);
    // The handshake ticket is fetched over REST, so the socket opens a tick late.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Production never passes peers as a prop: they arrive on the shared socket.
    pushPeers([
      { id: "peer-arch", name: "Architect Sophia", color: "#8b5cf6", x: 120, y: 250 },
    ]);
    await wrapper.vm.$nextTick();

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

  it("adapts canvas pattern color to light and dark theme", async () => {
    const preferences = usePreferencesStore();
    preferences.theme = "dark";
    const wrapperDark = mount(PipelineCanvasView);
    const bgDark = wrapperDark.findComponent({ name: "Background" });
    expect(bgDark.props("color")).toBe("rgba(255, 235, 200, 0.12)");

    preferences.theme = "light";
    const wrapperLight = mount(PipelineCanvasView);
    const bgLight = wrapperLight.findComponent({ name: "Background" });
    expect(bgLight.props("color")).toBe("rgba(80, 60, 30, 0.16)");
  });
});
