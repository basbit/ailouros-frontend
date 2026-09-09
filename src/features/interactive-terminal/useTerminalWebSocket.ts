import { getCurrentInstance, onBeforeUnmount, ref } from "vue";

export type TerminalConnectionStatus = "connecting" | "connected" | "disconnected";

export function useTerminalWebSocket(taskId: string) {
  const terminalOutput = ref<string>("");
  const connectionStatus = ref<TerminalConnectionStatus>("disconnected");
  let webSocketInstance: WebSocket | null = null;

  function isSocketOpen(): boolean {
    if (!webSocketInstance) return false;
    const openState =
      typeof WebSocket !== "undefined" && WebSocket.OPEN !== undefined
        ? WebSocket.OPEN
        : 1;
    return webSocketInstance.readyState === openState;
  }

  function connect(): void {
    if (!taskId) return;
    if (isSocketOpen()) {
      return;
    }

    connectionStatus.value = "connecting";
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const socketUrl = `${protocol}//${host}/ws/terminal/${encodeURIComponent(taskId)}`;

    const socket = new WebSocket(socketUrl);
    socket.binaryType = "arraybuffer";

    socket.onopen = () => {
      connectionStatus.value = "connected";
    };

    socket.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        terminalOutput.value += event.data;
      } else if (event.data instanceof ArrayBuffer) {
        const decoded = new TextDecoder().decode(event.data);
        terminalOutput.value += decoded;
      }
    };

    socket.onerror = () => {
      connectionStatus.value = "disconnected";
    };

    socket.onclose = () => {
      connectionStatus.value = "disconnected";
      webSocketInstance = null;
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
      const payload = JSON.stringify({ type: "resize", cols, rows });
      webSocketInstance.send(payload);
    }
  }

  function clear(): void {
    terminalOutput.value = "";
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      disconnect();
    });
  }

  return {
    terminalOutput,
    connectionStatus,
    connect,
    disconnect,
    sendInput,
    sendResize,
    clear,
  };
}
