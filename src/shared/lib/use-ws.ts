import { onUnmounted, ref } from "vue";
import { useWsStore } from "@/shared/store/ws";
import { getUiWebSocketUrl } from "@/shared/api/endpoints/ws";

interface WsTick {
  type: "tick";
  task_id?: string;
  status?: string;
  history?: { agent?: string; message?: string }[];
  agents?: string[];
  error?: unknown;
}

type WsMessage = WsTick | Record<string, unknown>;

export interface UseWsOptions {
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  onMessage?: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

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
    });

    unsubscribe = wsStore.subscribe((data) => {
      onMessage?.(data as WsMessage);
    });
  }

  function sendSubscribe(taskId?: string): void {
    try {
      wsStore.send({ cmd: "subscribe", task_id: taskId ?? null });
    } catch {
      /* socket not yet open */
    }
  }

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

  _connect();

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
