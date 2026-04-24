import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export type WsConnectionState = "disconnected" | "connecting" | "connected" | "error";

export type WsMessageHandler = (data: unknown) => void;

export const useWsStore = defineStore("ws", () => {
  const ws = shallowRef<WebSocket | null>(null);
  const connectionState = ref<WsConnectionState>("disconnected");
  const lastError = ref<string | null>(null);

  /** Subscribers registered via subscribe(). Cleared on disconnect. */
  const subscribers = new Set<WsMessageHandler>();

  /**
   * Open a WebSocket connection to `url`. Replaces any existing connection.
   * Reconnect-with-backoff logic lives in the `useWs` composable; this store
   * only tracks the raw instance and its lifecycle state.
   */
  function connect(url: string): WebSocket {
    _closeExisting();
    connectionState.value = "connecting";
    lastError.value = null;

    const socket = new WebSocket(url);
    ws.value = socket;

    socket.addEventListener("open", () => {
      connectionState.value = "connected";
    });

    socket.addEventListener("message", (ev: MessageEvent) => {
      try {
        const data: unknown = JSON.parse(ev.data as string);
        subscribers.forEach((fn) => fn(data));
      } catch {
        // Non-JSON frames — ignore silently.
      }
    });

    socket.addEventListener("close", () => {
      connectionState.value = "disconnected";
      ws.value = null;
    });

    socket.addEventListener("error", () => {
      lastError.value = "WebSocket error";
      connectionState.value = "error";
      try {
        socket.close();
      } catch {
        // already closed
      }
    });

    return socket;
  }

  /** Close the current connection and clear state. */
  function disconnect(): void {
    _closeExisting();
    connectionState.value = "disconnected";
    ws.value = null;
    subscribers.clear();
  }

  /**
   * Register a handler that will be called for every incoming message.
   * Returns an unsubscribe function.
   */
  function subscribe(handler: WsMessageHandler): () => void {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  /** Send a raw JSON-serialisable payload. Throws if the socket is not open. */
  function send(payload: unknown): void {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }
    ws.value.send(JSON.stringify(payload));
  }

  function _closeExisting(): void {
    const prev = ws.value;
    if (prev && prev.readyState < WebSocket.CLOSING) {
      try {
        prev.close();
      } catch {
        // ignore
      }
    }
  }

  return { ws, connectionState, lastError, connect, disconnect, subscribe, send };
});
