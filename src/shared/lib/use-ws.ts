import { onUnmounted, ref } from "vue";
import { useWsStore } from "@/shared/store/ws";
import { getUiWebSocketUrl } from "@/shared/api/endpoints/ws";

/** Typed tick payload from the server. */
export interface WsTick {
  type: "tick";
  task_id?: string;
  status?: string;
  history?: { agent?: string; message?: string }[];
  agents?: string[];
  error?: unknown;
}

export type WsMessage = WsTick | Record<string, unknown>;

export interface UseWsOptions {
  /** Milliseconds between reconnect attempts (default: 2000). */
  reconnectDelay?: number;
  /** Maximum reconnect delay in ms after exponential backoff (default: 30000). */
  maxReconnectDelay?: number;
  /** Called for every valid parsed message. */
  onMessage?: (msg: WsMessage) => void;
  /** Called when the connection opens. */
  onOpen?: () => void;
  /** Called when the connection closes (may be followed by a reconnect). */
  onClose?: () => void;
}

/**
 * Composable that owns the full WS lifecycle for a component.
 *
 * - Connects to `/ws/ui` respecting `VITE_API_BASE_URL`
 * - Automatically reconnects with exponential backoff
 * - Cleans up on `onUnmounted`
 */
export function useWs(options: UseWsOptions = {}) {
  const {
    reconnectDelay = 2000,
    maxReconnectDelay = 30_000,
    onMessage,
    onOpen,
    onClose,
  } = options;

  const wsStore = useWsStore();
  const isConnected = ref(false);
  const retryCount = ref(0);

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let destroyed = false;

  /** Unsubscribe handle returned by wsStore.subscribe(). */
  let unsubscribe: (() => void) | null = null;

  function _clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function _scheduleReconnect(): void {
    if (destroyed) return;
    _clearReconnectTimer();
    const delay = Math.min(
      reconnectDelay * Math.pow(1.5, retryCount.value),
      maxReconnectDelay,
    );
    retryCount.value += 1;
    reconnectTimer = setTimeout(() => {
      if (!destroyed) _connect();
    }, delay);
  }

  function _connect(): void {
    if (destroyed) return;

    // Remove previous subscriber before re-creating to avoid duplicates.
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    const url = getUiWebSocketUrl();
    const socket = wsStore.connect(url);

    socket.addEventListener("open", () => {
      isConnected.value = true;
      retryCount.value = 0;
      onOpen?.();
    });

    socket.addEventListener("close", () => {
      isConnected.value = false;
      onClose?.();
      _scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      isConnected.value = false;
      // The store's error handler closes the socket; onclose fires after.
    });

    // Register a per-message handler via the store.
    unsubscribe = wsStore.subscribe((data) => {
      onMessage?.(data as WsMessage);
    });
  }

  /** Send a subscribe command to the server (mirrors wsSendSubscribe in ui.js). */
  function sendSubscribe(taskId?: string): void {
    try {
      wsStore.send({ cmd: "subscribe", task_id: taskId ?? null });
    } catch {
      // Socket not yet open — the onOpen callback can call this.
    }
  }

  /** Manually disconnect without scheduling a reconnect. */
  function disconnect(): void {
    destroyed = true;
    _clearReconnectTimer();
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    wsStore.disconnect();
    isConnected.value = false;
  }

  // Start the connection.
  _connect();

  // Clean up when the owning component unmounts.
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    retryCount,
    sendSubscribe,
    disconnect,
  };
}
