import { httpPost } from "@/shared/api/http";

/**
 * A browser cannot set an `Authorization` header on a WebSocket handshake, and
 * a long-lived bearer token in the URL would end up in access logs and history.
 * So the SPA asks the backend for a single-use, surface-scoped ticket over
 * REST (where the header does work) and spends it on the handshake.
 */
export type WebSocketSurface = "ui" | "terminal" | "screencast" | "coworking";

interface WebSocketTicketResponse {
  ticket?: string;
  surface?: string;
  expires_in?: number;
}

export async function fetchWebSocketTicket(surface: WebSocketSurface): Promise<string> {
  const response = await httpPost<WebSocketTicketResponse>("/v1/ws/ticket", {
    surface,
  });
  const ticket = (response.ticket ?? "").trim();
  if (!ticket) {
    throw new Error(`backend returned an empty ${surface} websocket ticket`);
  }
  return ticket;
}
