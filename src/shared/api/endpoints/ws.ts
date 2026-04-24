import { SWARM_PUBLIC_API_BASE } from "@/shared/config";

/** WebSocket URL for /ws/ui; respects VITE_API_BASE_URL when set. */
export function getUiWebSocketUrl(): string {
  if (SWARM_PUBLIC_API_BASE) {
    const base = new URL(SWARM_PUBLIC_API_BASE, location.origin);
    base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
    base.pathname = "/ws/ui";
    base.search = "";
    base.hash = "";
    return base.toString();
  }
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws/ui`;
}
