import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import InteractiveTerminalModal from "../InteractiveTerminalModal.vue";

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  binaryType: string = "blob";
  readyState: number = 1;
  sentMessages: string[] = [];

  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => {
      this.onopen?.();
    }, 0);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.();
  }
}

describe("InteractiveTerminalModal", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  it("renders when open and emits close on button click", async () => {
    const wrapper = mount(InteractiveTerminalModal, {
      props: {
        taskId: "task-test-terminal",
        isOpen: true,
      },
    });
    await flushPromises();

    expect(wrapper.find(".terminal-modal").exists()).toBe(true);
    expect(wrapper.find(".terminal-modal__title").exists()).toBe(true);

    const closeBtn = wrapper.find(".terminal-modal__btn--close");
    await closeBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("sends command on form submit", async () => {
    const wrapper = mount(InteractiveTerminalModal, {
      props: {
        taskId: "task-test-terminal",
        isOpen: true,
      },
    });
    await flushPromises();

    const socket = MockWebSocket.instances[0];
    socket.onopen?.();
    await flushPromises();

    const input = wrapper.find(".terminal-modal__input");
    await input.setValue("git status");
    await wrapper.find(".terminal-modal__input-bar").trigger("submit");

    expect(socket.sentMessages).toContain("git status\n");
  });
});
