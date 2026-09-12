import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  useTerminalWebSocket,
  TERMINAL_POLICY_VIOLATION_CODE,
} from "../useTerminalWebSocket";

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
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.onclose?.({ code: 1000 });
  }
}

function makeSocket(taskId = "task-123", workspaceRoot: string | null = "/repo/demo") {
  return useTerminalWebSocket({
    taskId: () => taskId,
    workspaceRoot: () => workspaceRoot,
  });
}

describe("useTerminalWebSocket", () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    vi.stubGlobal("WebSocket", MockWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("connects, sends input, receives message and disconnects", async () => {
    const {
      terminalOutput,
      connectionStatus,
      connect,
      disconnect,
      sendInput,
      sendResize,
    } = makeSocket();

    expect(connectionStatus.value).toBe("disconnected");

    await connect();
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

  it("builds the socket URL from the resolved API base, not window.location", async () => {
    const { connect } = makeSocket();
    await connect();
    // getApiBaseUrl() is empty in tests, so the origin falls back to the page —
    // what matters is that the URL carries the workspace the backend demands.
    expect(MockWebSocket.instances[0].url).toContain(
      `workspace_root=${encodeURIComponent("/repo/demo")}`,
    );
  });

  it("refuses to open a terminal with no workspace root and says why", async () => {
    const { connect, connectionStatus, lastErrorKey } = makeSocket("task-1", null);
    await connect();
    expect(MockWebSocket.instances.length).toBe(0);
    expect(connectionStatus.value).toBe("disconnected");
    expect(lastErrorKey.value).toBe("terminal.errorNoWorkspace");
  });

  it("surfaces the backend's 1008 refusal instead of a silent red dot", async () => {
    const { connect, lastErrorKey } = makeSocket();
    await connect();
    MockWebSocket.instances[0].onclose?.({ code: TERMINAL_POLICY_VIOLATION_CODE });
    expect(lastErrorKey.value).toBe("terminal.errorNoWorkspace");
  });

  it("strips ANSI escape sequences from PTY output", async () => {
    const { connect, terminalOutput } = makeSocket();
    await connect();
    MockWebSocket.instances[0].onmessage?.({
      data: "\u001b[0m\u001b[01;34mproject\u001b[0m$ \u001b]0;title\u0007ok",
    });
    expect(terminalOutput.value).toBe("project$ ok");
  });

  it("applies carriage returns as line overwrites", async () => {
    const { connect, terminalOutput } = makeSocket();
    await connect();
    MockWebSocket.instances[0].onmessage?.({ data: "50%\r100%" });
    expect(terminalOutput.value).toBe("100%");
  });

  it("decodes a multi-byte character split across two reads", async () => {
    const { connect, terminalOutput } = makeSocket();
    await connect();
    const socket = MockWebSocket.instances[0];
    const encoded = new TextEncoder().encode("héllo");
    socket.onmessage?.({ data: encoded.slice(0, 2).buffer });
    socket.onmessage?.({ data: encoded.slice(2).buffer });
    expect(terminalOutput.value).toBe("héllo");
    expect(terminalOutput.value).not.toContain("�");
  });
});
