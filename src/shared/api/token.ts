/**
 * Where the SPA keeps the backend's `SWARM_API_TOKEN`.
 *
 * When the backend runs with a token set, every REST call needs
 * `Authorization: Bearer <token>` — without this module the whole SPA is dead
 * against a token-authenticated deployment, not just the WebSockets.
 */

import { SWARM_PUBLIC_API_TOKEN } from "@/shared/config";

export const API_TOKEN_STORAGE_KEY = "swarm.api_token";

/** Optional build-time default, for images baked for a single deployment. */
const BUILD_TIME_API_TOKEN: string = SWARM_PUBLIC_API_TOKEN;

function readStoredToken(): string {
  try {
    return (localStorage.getItem(API_TOKEN_STORAGE_KEY) ?? "").trim();
  } catch {
    // Private-mode / disabled site data: fall back to the build-time default.
    return "";
  }
}

export function getApiToken(): string {
  return readStoredToken() || BUILD_TIME_API_TOKEN;
}

export function setApiToken(token: string): void {
  const cleaned = (token ?? "").trim();
  if (!cleaned) {
    clearApiToken();
    return;
  }
  try {
    localStorage.setItem(API_TOKEN_STORAGE_KEY, cleaned);
  } catch {
    /* storage unavailable — the token simply does not persist */
  }
}

export function clearApiToken(): void {
  try {
    localStorage.removeItem(API_TOKEN_STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
}
