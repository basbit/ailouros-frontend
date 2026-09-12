/**
 * Whether a run error is the provider rejecting our credentials.
 *
 * Worth distinguishing because it is the one run failure the operator can fix
 * immediately, and it deserves a longer-lived, differently-worded toast than a
 * generic failure.
 */
const AUTH_FAILURE_MARKERS = [
  "401",
  "403",
  "unauthorized",
  "invalid api key",
  "invalid_api_key",
  "incorrect api key",
  "authentication failed",
] as const;

export function isAuthenticationFailure(error: unknown): boolean {
  const text = String(error || "").toLowerCase();
  return AUTH_FAILURE_MARKERS.some((marker) => text.includes(marker));
}
