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
  const proto = location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${location.host}/ws/ui`;
}
