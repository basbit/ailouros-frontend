import { getCurrentInstance, onBeforeUnmount, onDeactivated, ref } from "vue";
import { getTerminalWebSocketUrl } from "@/shared/api/endpoints/ws";
import { createPtyTextBuffer } from "./terminalTextBuffer";

export type TerminalConnectionStatus = "connecting" | "connected" | "disconnected";

/** Starlette's 1008 policy-violation code, sent when no workspace root is bound. */
export const TERMINAL_POLICY_VIOLATION_CODE = 1008;
const NORMAL_CLOSE_CODE = 1000;
const NO_STATUS_CODE = 1005;

export interface TerminalSocketOptions {
  taskId: () => string;
  workspaceRoot: () => string | null;
}

export function useTerminalWebSocket(options: TerminalSocketOptions) {
  const outputBuffer = createPtyTextBuffer();
  const terminalOutput = ref<string>("");
  const connectionStatus = ref<TerminalConnectionStatus>("disconnected");
  const lastErrorKey = ref<string | null>(null);
  let webSocketInstance: WebSocket | null = null;

  function isSocketOpen(): boolean {
    if (!webSocketInstance) return false;
    const openState =
      typeof WebSocket !== "undefined" && WebSocket.OPEN !== undefined
        ? WebSocket.OPEN
        : 1;
    return webSocketInstance.readyState === openState;
  }

  async function connect(): Promise<void> {
    const taskId = options.taskId();
    if (!taskId) {
      lastErrorKey.value = "terminal.errorNoTask";
      return;
    }
    if (isSocketOpen()) return;

    const workspaceRoot = (options.workspaceRoot() ?? "").trim();
    if (!workspaceRoot) {
      // The backend refuses a terminal without a workspace root rather than
      // dropping the operator into the backend's own checkout. Say so here
      // instead of opening a socket that is guaranteed to be closed with 1008.
      connectionStatus.value = "disconnected";
      lastErrorKey.value = "terminal.errorNoWorkspace";
      return;
    }

    connectionStatus.value = "connecting";
    lastErrorKey.value = null;

    let url: string;
    try {
      url = await getTerminalWebSocketUrl(taskId, workspaceRoot);
    } catch {
      connectionStatus.value = "disconnected";
      lastErrorKey.value = "terminal.errorConnection";
      return;
    }
    if (isSocketOpen()) return;

    const socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      connectionStatus.value = "connected";
    };

    socket.onmessage = (event: MessageEvent) => {
      // binaryType is "arraybuffer", so anything that is not text is bytes.
      if (typeof event.data === "string") {
        terminalOutput.value = outputBuffer.appendText(event.data);
      } else {
        terminalOutput.value = outputBuffer.appendBytes(
          event.data as ArrayBuffer | ArrayBufferView,
        );
      }
    };

    socket.onerror = () => {
      connectionStatus.value = "disconnected";
      if (!lastErrorKey.value) lastErrorKey.value = "terminal.errorConnection";
    };

    socket.onclose = (event?: CloseEvent) => {
      connectionStatus.value = "disconnected";
      webSocketInstance = null;
      if (event === undefined) return;
      if (event.code === TERMINAL_POLICY_VIOLATION_CODE) {
        lastErrorKey.value = "terminal.errorNoWorkspace";
      } else if (event.code !== NORMAL_CLOSE_CODE && event.code !== NO_STATUS_CODE) {
        lastErrorKey.value = "terminal.errorConnection";
      }
    };

    webSocketInstance = socket;
  }

  function disconnect(): void {
    if (webSocketInstance) {
      webSocketInstance.close();
      webSocketInstance = null;
    }
    connectionStatus.value = "disconnected";
  }

  function sendInput(data: string): void {
    if (isSocketOpen() && webSocketInstance) {
      webSocketInstance.send(data);
    }
  }

  function sendResize(cols: number, rows: number): void {
    if (isSocketOpen() && webSocketInstance) {
      webSocketInstance.send(JSON.stringify({ type: "resize", cols, rows }));
    }
  }

  function clear(): void {
    terminalOutput.value = outputBuffer.clear();
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(disconnect);
    onDeactivated(disconnect);
  }

  return {
    terminalOutput,
    connectionStatus,
    lastErrorKey,
    connect,
    disconnect,
    sendInput,
    sendResize,
    clear,
  };
}
