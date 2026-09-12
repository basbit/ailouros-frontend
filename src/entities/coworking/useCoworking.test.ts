import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import type { useCoworking as UseCoworking } from "./useCoworking";

vi.mock("@/shared/api/ws-ticket", () => ({
  fetchWebSocketTicket: async () => "test-ticket",
}));

/** The handshake ticket is fetched over REST, so the socket opens a tick late. */
function flushSocketOpen(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;
  url: string;
  readyState = 1;
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
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

async function loadUseCoworking(): Promise<typeof UseCoworking> {
  vi.resetModules();
  const module = await import("./useCoworking");
  return module.useCoworking;
}

function mountConsumer(useCoworking: typeof UseCoworking) {
  const Consumer = defineComponent({
    setup() {
      const session = useCoworking("test-space");
      return () => h("div", session.localUser.value.id);
    },
  });
  return mount(Consumer);
}

describe("useCoworking", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens exactly one socket no matter how many components use it", async () => {
    const useCoworking = await loadUseCoworking();
    const first = mountConsumer(useCoworking);
    const second = mountConsumer(useCoworking);
    const third = mountConsumer(useCoworking);
    await flushSocketOpen();

    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain("/ws/coworking/test-space");

    await new Promise((resolve) => setTimeout(resolve, 10));
    const joinPackets = MockWebSocket.instances[0].sentMessages
      .map((raw) => JSON.parse(raw) as { type: string })
      .filter((packet) => packet.type === "join");
    expect(joinPackets.length).toBe(1);

    first.unmount();
    second.unmount();
    third.unmount();
  });

  it("keeps the socket open while at least one consumer is mounted", async () => {
    const useCoworking = await loadUseCoworking();
    const header = mountConsumer(useCoworking);
    const page = mountConsumer(useCoworking);
    await flushSocketOpen();

    page.unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.OPEN);

    header.unmount();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(MockWebSocket.instances[0].readyState).toBe(MockWebSocket.CLOSED);
  });

  it("shares peers and claims between every consumer", async () => {
    const useCoworking = await loadUseCoworking();
    const wrapper = mountConsumer(useCoworking);
    const sessionA = useCoworking("test-space");
    const sessionB = useCoworking("test-space");
    await flushSocketOpen();

    MockWebSocket.instances[0].onmessage?.({
      data: JSON.stringify({
        type: "peers",
        peers: [{ id: "peer-1", name: "Alice", color: "#3b82f6", x: 10, y: 20 }],
      }),
    });

    expect(sessionA.peers.value.length).toBe(1);
    expect(sessionB.peers.value[0].name).toBe("Alice");
    wrapper.unmount();
  });

  it("decodes the snake_case claims snapshot the backend actually sends", async () => {
    const useCoworking = await loadUseCoworking();
    const wrapper = mountConsumer(useCoworking);
    const session = useCoworking("test-space");
    await flushSocketOpen();

    MockWebSocket.instances[0].onmessage?.({
      data: JSON.stringify({
        type: "claims",
        claims: [
          {
            task_id: "task-snapshot-1",
            gate_id: "dev-gate",
            user_id: "peer-1",
            user_name: "Alice",
          },
        ],
      }),
    });

    expect(session.gateClaims.value.has("task-snapshot-1")).toBe(true);
    expect(session.gateClaims.value.get("task-snapshot-1")?.userName).toBe("Alice");
    expect(session.gateClaims.value.has("undefined")).toBe(false);
    wrapper.unmount();
  });

  it("handles per-event claim and release packets", async () => {
    const useCoworking = await loadUseCoworking();
    const wrapper = mountConsumer(useCoworking);
    const session = useCoworking("test-space");
    await flushSocketOpen();
    const socket = MockWebSocket.instances[0];

    socket.onmessage?.({
      data: JSON.stringify({
        type: "gate_claimed",
        task_id: "task-claim-99",
        gate_id: "dev-gate",
        user_id: "peer-1",
        user_name: "Alice",
      }),
    });
    expect(session.gateClaims.value.get("task-claim-99")?.userName).toBe("Alice");

    socket.onmessage?.({
      data: JSON.stringify({ type: "gate_released", task_id: "task-claim-99" }),
    });
    expect(session.gateClaims.value.has("task-claim-99")).toBe(false);
    wrapper.unmount();
  });

  it("updates local user profile and broadcasts join packet", async () => {
    const useCoworking = await loadUseCoworking();
    const wrapper = mountConsumer(useCoworking);
    const session = useCoworking("test-space");
    await flushSocketOpen();
    const socket = MockWebSocket.instances[0];
    await new Promise((resolve) => setTimeout(resolve, 10));

    session.updateLocalUserProfile("Lead Architect Dave", "#ec4899");

    expect(session.localUser.value.name).toBe("Lead Architect Dave");
    const saved = JSON.parse(localStorage.getItem("swarm_local_user") || "{}");
    expect(saved.name).toBe("Lead Architect Dave");

    const lastMessage = JSON.parse(socket.sentMessages[socket.sentMessages.length - 1]);
    expect(lastMessage.type).toBe("join");
    expect(lastMessage.name).toBe("Lead Architect Dave");
    expect(lastMessage.color).toBe("#ec4899");
    wrapper.unmount();
  });
});
