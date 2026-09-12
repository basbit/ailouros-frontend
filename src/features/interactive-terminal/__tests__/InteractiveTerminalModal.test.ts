import { describe, expect, it, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import InteractiveTerminalModal from "../InteractiveTerminalModal.vue";

vi.mock("@/shared/api/ws-ticket", () => ({
  fetchWebSocketTicket: async () => "test-ticket",
}));

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
  onclose: ((event: { code: number }) => void) | null = null;

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
    this.onclose?.({ code: 1000 });
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
        workspaceRoot: "/repo/demo",
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
        workspaceRoot: "/repo/demo",
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

  it("closes on Escape without needing a click inside first", async () => {
    const wrapper = mount(InteractiveTerminalModal, {
      props: {
        taskId: "task-test-terminal",
        workspaceRoot: "/repo/demo",
        isOpen: true,
      },
      attachTo: document.body,
    });
    await flushPromises();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flushPromises();

    expect(wrapper.emitted("close")).toBeTruthy();
    wrapper.unmount();
  });

  it("moves focus into the dialog when it opens", async () => {
    const wrapper = mount(InteractiveTerminalModal, {
      props: {
        taskId: "task-test-terminal",
        workspaceRoot: "/repo/demo",
        isOpen: true,
      },
      attachTo: document.body,
    });
    await flushPromises();

    expect(
      wrapper.find(".terminal-modal").element.contains(document.activeElement),
    ).toBe(true);
    wrapper.unmount();
  });

  it("shows a real message when no workspace root is bound", async () => {
    const wrapper = mount(InteractiveTerminalModal, {
      props: { taskId: "task-test-terminal", workspaceRoot: null, isOpen: true },
    });
    await flushPromises();

    expect(MockWebSocket.instances.length).toBe(0);
    expect(wrapper.find(".terminal-modal__error").text()).toContain(
      "the workspace the run is bound to",
    );
  });
});
