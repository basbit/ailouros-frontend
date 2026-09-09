import { describe, expect, it, vi, beforeEach } from "vitest";
import { useTerminalWebSocket } from "../useTerminalWebSocket";

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

describe("useTerminalWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  it("connects, sends input, receives message and disconnects", async () => {
    const {
      terminalOutput,
      connectionStatus,
      connect,
      disconnect,
      sendInput,
      sendResize,
    } = useTerminalWebSocket("task-123");

    expect(connectionStatus.value).toBe("disconnected");

    connect();
    expect(MockWebSocket.instances.length).toBe(1);
    const socket = MockWebSocket.instances[0];
    expect(socket.url).toContain("/ws/terminal/task-123");

    socket.onopen?.();
    expect(connectionStatus.value).toBe("connected");

    socket.onmessage?.({ data: "bash-5.1$ " });
    expect(terminalOutput.value).toBe("bash-5.1$ ");

    sendInput("ls -la\n");
    expect(socket.sentMessages).toContain("ls -la\n");

    sendResize(80, 24);
    expect(socket.sentMessages).toContain(
      JSON.stringify({ type: "resize", cols: 80, rows: 24 }),
    );

    disconnect();
    expect(connectionStatus.value).toBe("disconnected");
  });
});
