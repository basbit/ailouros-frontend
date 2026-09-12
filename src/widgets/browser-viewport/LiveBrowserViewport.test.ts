import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import LiveBrowserViewport from "./LiveBrowserViewport.vue";

vi.mock("@/shared/api/ws-ticket", () => ({
  fetchWebSocketTicket: async () => "test-ticket",
}));

/** The handshake ticket is fetched over REST, so the socket opens a tick late. */
function flushSocketOpen(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

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

  it("connects to screencast websocket on mount", async () => {
    mount(LiveBrowserViewport, {
      props: {
        taskId: "task-browser-1",
      },
    });
    await flushSocketOpen();

    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain("/ws/screencast/task-browser-1");
  });

  it("updates viewport mode and sends resize command", async () => {
    const wrapper = mount(LiveBrowserViewport, {
      props: {
        taskId: "task-browser-1",
      },
    });

    await flushSocketOpen();

    const mobileBtn = wrapper.findAll(".live-browser-viewport__mode-btn")[1];
    await mobileBtn.trigger("click");

    const ws = MockWebSocket.instances[0];
    const lastMsg = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1] ?? "{}");
    expect(lastMsg.type).toBe("resize");
    expect(lastMsg.width).toBe(390);
    expect(lastMsg.height).toBe(844);
  });

  it("does not claim 'connecting' once the stream has failed", async () => {
    const wrapper = mount(LiveBrowserViewport, {
      props: { taskId: "task-fail" },
    });
    await flushSocketOpen();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".live-browser-viewport__placeholder").text()).toContain(
      "liveBrowser.connecting",
    );

    MockWebSocket.instances[0].onerror?.();
    await wrapper.vm.$nextTick();

    const placeholder = wrapper.find(".live-browser-viewport__placeholder");
    expect(placeholder.text()).toContain("liveBrowser.streamFailed");
    expect(placeholder.text()).not.toContain("liveBrowser.connecting");
  });

  it("starts with an empty address bar instead of a guessed dev-server URL", () => {
    const wrapper = mount(LiveBrowserViewport, {
      props: { taskId: "task-url" },
    });
    const input = wrapper.find<HTMLInputElement>(".live-browser-viewport__url-input");
    expect(input.element.value).toBe("");
  });

  it("closes the screencast socket when the cached route is deactivated", async () => {
    const KeepAliveHost = defineComponent({
      components: { LiveBrowserViewport },
      props: { visible: { type: Boolean, default: true } },
      template: `<KeepAlive><LiveBrowserViewport v-if="visible" task-id="task-keepalive" /></KeepAlive>`,
    });

    const wrapper = mount(KeepAliveHost);
    await flushSocketOpen();
    const socket = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    expect(socket.readyState).toBe(MockWebSocket.OPEN);

    await wrapper.setProps({ visible: false });
    expect(socket.readyState).toBe(MockWebSocket.CLOSED);
  });
});
