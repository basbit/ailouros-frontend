import { getApiBaseUrl } from "@/shared/api/base";

export function getUiWebSocketUrl(): string {
  const base = getApiBaseUrl();
  if (base) {
    const url = new URL(base, location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws/ui";
    url.search = "";
    url.hash = "";
    return url.toString();
  }
  const protocolScheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocolScheme}//${location.host}/ws/ui`;
}

export function getScreencastWebSocketUrl(taskId: string): string {
  const base = getApiBaseUrl();
  const path = `/ws/screencast/${encodeURIComponent(taskId)}`;
  if (base) {
    const url = new URL(base, location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = path;
    url.search = "";
    url.hash = "";
    return url.toString();
  }
  const protocolScheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocolScheme}//${location.host}${path}`;
}

export function getCoworkingWebSocketUrl(workspaceId = "default"): string {
  const base = getApiBaseUrl();
  const path = `/ws/coworking/${encodeURIComponent(workspaceId)}`;
  if (base) {
    const url = new URL(base, location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = path;
    url.search = "";
    url.hash = "";
    return url.toString();
  }
  const protocolScheme = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocolScheme}//${location.host}${path}`;
}
