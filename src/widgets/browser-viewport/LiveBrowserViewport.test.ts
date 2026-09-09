import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import LiveBrowserViewport from "./LiveBrowserViewport.vue";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;
  url: string;
  readyState = 1; // WebSocket.OPEN
  sentMessages: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }

  send(data: string) {
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }
}

describe("LiveBrowserViewport", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("connects to screencast websocket on mount", () => {
    mount(LiveBrowserViewport, {
      props: {
        taskId: "task-browser-1",
      },
    });

    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain("/ws/screencast/task-browser-1");
  });

  it("updates viewport mode and sends resize command", async () => {
    const wrapper = mount(LiveBrowserViewport, {
      props: {
        taskId: "task-browser-1",
      },
    });

    const mobileBtn = wrapper.findAll(".live-browser-viewport__mode-btn")[1];
    await mobileBtn.trigger("click");

    const ws = MockWebSocket.instances[0];
    const lastMsg = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1] ?? "{}");
    expect(lastMsg.type).toBe("resize");
    expect(lastMsg.width).toBe(390);
    expect(lastMsg.height).toBe(844);
  });
});
