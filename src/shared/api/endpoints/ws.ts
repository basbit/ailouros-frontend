/** WebSocket URL for /ws/ui; in dev, Vite proxies the /ws path. */
export function getUiWebSocketUrl(): string {
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws/ui`;
}
