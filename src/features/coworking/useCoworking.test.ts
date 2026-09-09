import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useCoworking } from "./useCoworking";

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
    this.readyState = 3;
    this.onclose?.();
  }
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

  it("connects to coworking websocket and sends join packet", async () => {
    const coworking = useCoworking("test-space");

    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toContain("/ws/coworking/test-space");

    // Wait for onopen
    await new Promise((r) => setTimeout(r, 10));

    const ws = MockWebSocket.instances[0];
    expect(ws.sentMessages.length).toBeGreaterThan(0);
    const joinMsg = JSON.parse(ws.sentMessages[0]);
    expect(joinMsg.type).toBe("join");
    expect(joinMsg.user_id).toBe(coworking.localUser.value.id);
  });

  it("handles incoming peers and gate claims", async () => {
    const coworking = useCoworking("test-space");
    const ws = MockWebSocket.instances[0];

    // Simulate incoming peers
    ws.onmessage?.({
      data: JSON.stringify({
        type: "peers",
        peers: [{ id: "peer-1", name: "Alice", color: "#3b82f6", x: 10, y: 20 }],
      }),
    });

    expect(coworking.peers.value.length).toBe(1);
    expect(coworking.peers.value[0].name).toBe("Alice");

    // Simulate gate claim
    ws.onmessage?.({
      data: JSON.stringify({
        type: "gate_claimed",
        task_id: "task-claim-99",
        gate_id: "dev-gate",
        user_id: "peer-1",
        user_name: "Alice",
      }),
    });

    expect(coworking.gateClaims.value.has("task-claim-99")).toBe(true);
    expect(coworking.gateClaims.value.get("task-claim-99")?.userName).toBe("Alice");
  });

  it("updates local user profile and broadcasts join packet", async () => {
    const coworking = useCoworking("test-space");
    const ws = MockWebSocket.instances[0];
    await new Promise((r) => setTimeout(r, 10));

    coworking.updateLocalUserProfile("Lead Architect Dave", "#ec4899");

    expect(coworking.localUser.value.name).toBe("Lead Architect Dave");
    expect(coworking.localUser.value.color).toBe("#ec4899");

    // Check localStorage
    const saved = JSON.parse(localStorage.getItem("swarm_local_user") || "{}");
    expect(saved.name).toBe("Lead Architect Dave");
    expect(saved.color).toBe("#ec4899");

    // Check broadcast message
    const lastMsg = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1]);
    expect(lastMsg.type).toBe("join");
    expect(lastMsg.name).toBe("Lead Architect Dave");
    expect(lastMsg.color).toBe("#ec4899");
  });
});
