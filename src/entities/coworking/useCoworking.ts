import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref } from "vue";
import { getCoworkingWebSocketUrl } from "@/shared/api/endpoints/ws";

export interface RemotePeer {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface GateClaimInfo {
  taskId: string;
  gateId: string;
  userId: string;
  userName: string;
}

export interface LocalUserProfile {
  id: string;
  name: string;
  color: string;
}

export const PEER_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

function getOrCreateLocalUser(): LocalUserProfile {
  try {
    const saved = localStorage.getItem("swarm_local_user");
    if (saved) {
      const parsed = JSON.parse(saved) as LocalUserProfile;
      if (parsed.id && parsed.name && parsed.color) return parsed;
    }
  } catch {
    /* ignore storage read error */
  }

  const id = "u_" + Math.random().toString(36).substring(2, 9);
  const color = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];
  const name = "Operator " + id.slice(-3).toUpperCase();
  const profile: LocalUserProfile = { id, name, color };

  try {
    localStorage.setItem("swarm_local_user", JSON.stringify(profile));
  } catch {
    /* ignore storage write error */
  }

  return profile;
}

export function useCoworking(workspaceId = "default") {
  const localUser = ref<LocalUserProfile>(getOrCreateLocalUser());
  const peers = ref<RemotePeer[]>([]);
  const gateClaims = ref<Map<string, GateClaimInfo>>(new Map());
  const isConnected = ref(false);

  let socket: WebSocket | null = null;
  let lastCursorTime = 0;

  function connect(): void {
    if (socket) {
      socket.close();
      socket = null;
    }

    const url = getCoworkingWebSocketUrl(workspaceId);
    try {
      const ws = new WebSocket(url);
      socket = ws;

      ws.onopen = () => {
        isConnected.value = true;
        // Send join packet
        ws.send(
          JSON.stringify({
            type: "join",
            user_id: localUser.value.id,
            name: localUser.value.name,
            color: localUser.value.color,
          }),
        );
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data as string) as {
            type?: string;
            peers?: RemotePeer[];
            claims?: GateClaimInfo[];
            task_id?: string;
            gate_id?: string;
            user_id?: string;
            user_name?: string;
            x?: number;
            y?: number;
            view?: string;
          };

          if (message.type === "peers" && Array.isArray(message.peers)) {
            peers.value = message.peers.filter(
              (peer) => peer.id !== localUser.value.id,
            );
          } else if (message.type === "cursor_update" && message.user_id) {
            const peer = peers.value.find(
              (peerItem) => peerItem.id === message.user_id,
            );
            if (
              peer &&
              typeof message.x === "number" &&
              typeof message.y === "number"
            ) {
              peer.x = message.x;
              peer.y = message.y;
            }
          } else if (message.type === "claims" && Array.isArray(message.claims)) {
            const map = new Map<string, GateClaimInfo>();
            for (const claim of message.claims) {
              map.set(claim.taskId, claim);
            }
            gateClaims.value = map;
          } else if (message.type === "gate_claimed" && message.task_id) {
            const next = new Map(gateClaims.value);
            next.set(message.task_id, {
              taskId: message.task_id,
              gateId: message.gate_id ?? "default",
              userId: message.user_id ?? "",
              userName: message.user_name ?? "User",
            });
            gateClaims.value = next;
          } else if (message.type === "gate_released" && message.task_id) {
            const next = new Map(gateClaims.value);
            next.delete(message.task_id);
            gateClaims.value = next;
          }
        } catch {
          /* ignore json parse errors */
        }
      };

      ws.onclose = () => {
        isConnected.value = false;
      };

      ws.onerror = () => {
        isConnected.value = false;
      };
    } catch {
      isConnected.value = false;
    }
  }

  function sendCursor(x: number, y: number, view = "canvas"): void {
    const now = Date.now();
    if (now - lastCursorTime < 40) return; // Throttle to ~25fps
    lastCursorTime = now;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "cursor",
          x,
          y,
          view,
        }),
      );
    }
  }

  function claimGate(taskId: string, gateId = "default"): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "claim_gate",
          task_id: taskId,
          gate_id: gateId,
        }),
      );
    }
  }

  function releaseGate(taskId: string): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "release_gate",
          task_id: taskId,
        }),
      );
    }
  }

  function updateLocalUserProfile(name: string, color: string): void {
    localUser.value = { ...localUser.value, name, color };
    try {
      localStorage.setItem("swarm_local_user", JSON.stringify(localUser.value));
    } catch {
      /* ignore */
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "join",
          user_id: localUser.value.id,
          name: localUser.value.name,
          color: localUser.value.color,
        }),
      );
    }
  }

  function disconnect(): void {
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      connect();
    });

    onBeforeUnmount(() => {
      disconnect();
    });
  } else {
    connect();
  }

  const onlinePeersCount = computed(() => peers.value.length);

  return {
    localUser,
    peers,
    gateClaims,
    isConnected,
    onlinePeersCount,
    connect,
    disconnect,
    updateLocalUserProfile,
    sendCursor,
    claimGate,
    releaseGate,
  };
}
