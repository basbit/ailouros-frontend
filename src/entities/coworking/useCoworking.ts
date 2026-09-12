import {
  computed,
  getCurrentInstance,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  type ComputedRef,
  type Ref,
} from "vue";
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

export interface CoworkingSession {
  localUser: Ref<LocalUserProfile>;
  peers: Ref<RemotePeer[]>;
  gateClaims: Ref<Map<string, GateClaimInfo>>;
  isConnected: Ref<boolean>;
  onlinePeersCount: ComputedRef<number>;
  connect: () => void;
  disconnect: () => void;
  updateLocalUserProfile: (name: string, color: string) => void;
  sendCursor: (x: number, y: number, view?: string) => void;
  claimGate: (taskId: string, gateId?: string) => void;
  releaseGate: (taskId: string) => void;
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

const CURSOR_THROTTLE_MS = 40;

interface CoworkingWireMessage {
  type?: string;
  peers?: RemotePeer[];
  claims?: {
    task_id?: string;
    gate_id?: string;
    user_id?: string;
    user_name?: string;
  }[];
  task_id?: string;
  gate_id?: string;
  user_id?: string;
  user_name?: string;
  x?: number;
  y?: number;
  view?: string;
}

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

function toGateClaim(
  entry: NonNullable<CoworkingWireMessage["claims"]>[number],
): GateClaimInfo | null {
  if (!entry.task_id) return null;
  return {
    taskId: entry.task_id,
    gateId: entry.gate_id ?? "default",
    userId: entry.user_id ?? "",
    userName: entry.user_name ?? "User",
  };
}

/**
 * The backend keys one socket per user id, so a second socket from the same tab
 * evicts the first and its close releases that user's gate claims. Every caller
 * therefore shares one reference-counted session per workspace.
 */
function createCoworkingSession(workspaceId: string): CoworkingSession & {
  acquire: () => void;
  release: () => void;
} {
  const localUser = ref<LocalUserProfile>(getOrCreateLocalUser());
  const peers = ref<RemotePeer[]>([]);
  const gateClaims = ref<Map<string, GateClaimInfo>>(new Map());
  const isConnected = ref(false);

  let socket: WebSocket | null = null;
  let socketPending = false;
  let lastCursorTime = 0;
  let referenceCount = 0;
  let pendingDisconnect: ReturnType<typeof setTimeout> | null = null;

  function sendJoinPacket(target: WebSocket): void {
    target.send(
      JSON.stringify({
        type: "join",
        user_id: localUser.value.id,
        name: localUser.value.name,
        color: localUser.value.color,
      }),
    );
  }

  function applyMessage(message: CoworkingWireMessage): void {
    if (message.type === "peers" && Array.isArray(message.peers)) {
      peers.value = message.peers.filter((peer) => peer.id !== localUser.value.id);
      return;
    }
    if (message.type === "cursor_update" && message.user_id) {
      const peer = peers.value.find((peerItem) => peerItem.id === message.user_id);
      if (peer && typeof message.x === "number" && typeof message.y === "number") {
        peer.x = message.x;
        peer.y = message.y;
      }
      return;
    }
    if (message.type === "claims" && Array.isArray(message.claims)) {
      const nextClaims = new Map<string, GateClaimInfo>();
      for (const entry of message.claims) {
        const claim = toGateClaim(entry);
        if (claim) nextClaims.set(claim.taskId, claim);
      }
      gateClaims.value = nextClaims;
      return;
    }
    if (message.type === "gate_claimed" && message.task_id) {
      const claim = toGateClaim(message);
      if (!claim) return;
      const nextClaims = new Map(gateClaims.value);
      nextClaims.set(claim.taskId, claim);
      gateClaims.value = nextClaims;
      return;
    }
    if (message.type === "gate_released" && message.task_id) {
      const nextClaims = new Map(gateClaims.value);
      nextClaims.delete(message.task_id);
      gateClaims.value = nextClaims;
    }
  }

  async function openSocket(): Promise<void> {
    if (socket || socketPending) return;

    // The handshake ticket is fetched over REST, so two acquire() calls can
    // interleave inside this await; the flag keeps it to one socket.
    socketPending = true;
    let url: string;
    try {
      url = await getCoworkingWebSocketUrl(workspaceId);
    } catch {
      socketPending = false;
      isConnected.value = false;
      return;
    }
    socketPending = false;
    if (socket) return;

    try {
      const ws = new WebSocket(url);
      socket = ws;

      ws.onopen = () => {
        isConnected.value = true;
        sendJoinPacket(ws);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          applyMessage(JSON.parse(event.data as string) as CoworkingWireMessage);
        } catch {
          /* ignore json parse errors */
        }
      };

      ws.onclose = () => {
        isConnected.value = false;
        if (socket === ws) socket = null;
      };

      ws.onerror = () => {
        isConnected.value = false;
      };
    } catch {
      socket = null;
      isConnected.value = false;
    }
  }

  function closeSocket(): void {
    if (socket) {
      socket.close();
      socket = null;
    }
    isConnected.value = false;
    peers.value = [];
    gateClaims.value = new Map();
  }

  function acquire(): void {
    referenceCount += 1;
    if (pendingDisconnect !== null) {
      clearTimeout(pendingDisconnect);
      pendingDisconnect = null;
    }
    void openSocket();
  }

  function release(): void {
    if (referenceCount === 0) return;
    referenceCount -= 1;
    if (referenceCount > 0 || pendingDisconnect !== null) return;
    // Route changes deactivate the outgoing view before the incoming one is
    // activated, so the count dips to zero for one tick. Closing on that dip
    // would evict the peer and release its gate claims on every navigation.
    pendingDisconnect = setTimeout(() => {
      pendingDisconnect = null;
      if (referenceCount === 0) closeSocket();
    }, 0);
  }

  function isSocketOpen(): boolean {
    return socket !== null && socket.readyState === WebSocket.OPEN;
  }

  function sendCursor(x: number, y: number, view = "canvas"): void {
    const now = Date.now();
    if (now - lastCursorTime < CURSOR_THROTTLE_MS) return;
    lastCursorTime = now;
    if (isSocketOpen()) {
      socket?.send(JSON.stringify({ type: "cursor", x, y, view }));
    }
  }

  function claimGate(taskId: string, gateId = "default"): void {
    if (isSocketOpen()) {
      socket?.send(
        JSON.stringify({ type: "claim_gate", task_id: taskId, gate_id: gateId }),
      );
    }
  }

  function releaseGate(taskId: string): void {
    if (isSocketOpen()) {
      socket?.send(JSON.stringify({ type: "release_gate", task_id: taskId }));
    }
  }

  function updateLocalUserProfile(name: string, color: string): void {
    localUser.value = { ...localUser.value, name, color };
    try {
      localStorage.setItem("swarm_local_user", JSON.stringify(localUser.value));
    } catch {
      /* ignore storage write error */
    }
    if (isSocketOpen() && socket) {
      sendJoinPacket(socket);
    }
  }

  return {
    localUser,
    peers,
    gateClaims,
    isConnected,
    onlinePeersCount: computed(() => peers.value.length),
    connect: acquire,
    disconnect: release,
    acquire,
    release,
    updateLocalUserProfile,
    sendCursor,
    claimGate,
    releaseGate,
  };
}

const sessionsByWorkspace = new Map<
  string,
  ReturnType<typeof createCoworkingSession>
>();

export function useCoworking(workspaceId = "default"): CoworkingSession {
  let session = sessionsByWorkspace.get(workspaceId);
  if (!session) {
    session = createCoworkingSession(workspaceId);
    sessionsByWorkspace.set(workspaceId, session);
  }
  const active = session;

  if (getCurrentInstance()) {
    // Every route lives inside <keep-alive>, so leaving a page fires
    // onDeactivated instead of onBeforeUnmount. Both must release.
    onMounted(active.acquire);
    onActivated(active.acquire);
    onDeactivated(active.release);
    onBeforeUnmount(active.release);
  }

  return active;
}
