/**
 * Where the SPA keeps the backend's `SWARM_API_TOKEN`.
 *
 * When the backend runs with a token set, every REST call needs
 * `Authorization: Bearer <token>` — without this module the whole SPA is dead
 * against a token-authenticated deployment, not just the WebSockets.
 */

import { SWARM_PUBLIC_API_TOKEN } from "@/shared/config";
import { persistenceAdapter } from "@/shared/lib/persistence-adapter";

export const API_TOKEN_STORAGE_KEY = "swarm.api_token";

/** Optional build-time default, for images baked for a single deployment. */
const BUILD_TIME_API_TOKEN: string = SWARM_PUBLIC_API_TOKEN;

function readStoredToken(): string {
  // The adapter absorbs private-mode / disabled-site-data failures, in which
  // case the build-time default takes over.
  return (persistenceAdapter.readString(API_TOKEN_STORAGE_KEY) ?? "").trim();
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
  persistenceAdapter.write(API_TOKEN_STORAGE_KEY, cleaned);
}

export function clearApiToken(): void {
  persistenceAdapter.remove(API_TOKEN_STORAGE_KEY);
}
