import { getApiBaseUrl } from "@/shared/api/base";
import { fetchWebSocketTicket, type WebSocketSurface } from "@/shared/api/ws-ticket";

async function buildWebSocketUrl(
  path: string,
  surface: WebSocketSurface,
  query?: Record<string, string>,
): Promise<string> {
  const base = getApiBaseUrl();
  const url = base
    ? new URL(base, location.origin)
    : new URL(`${location.protocol}//${location.host}`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = path;
  url.search = "";
  url.hash = "";
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value) url.searchParams.set(name, value);
  }
  // Minted last so a failure aborts before any socket is opened.
  url.searchParams.set("ticket", await fetchWebSocketTicket(surface));
  return url.toString();
}

export function getUiWebSocketUrl(): Promise<string> {
  return buildWebSocketUrl("/ws/ui", "ui");
}

export function getScreencastWebSocketUrl(taskId: string): Promise<string> {
  return buildWebSocketUrl(
    `/ws/screencast/${encodeURIComponent(taskId)}`,
    "screencast",
  );
}

export function getCoworkingWebSocketUrl(workspaceId = "default"): Promise<string> {
  return buildWebSocketUrl(
    `/ws/coworking/${encodeURIComponent(workspaceId)}`,
    "coworking",
  );
}

export function getTerminalWebSocketUrl(
  taskId: string,
  workspaceRoot: string | null,
): Promise<string> {
  return buildWebSocketUrl(`/ws/terminal/${encodeURIComponent(taskId)}`, "terminal", {
    workspace_root: workspaceRoot ?? "",
  });
}
