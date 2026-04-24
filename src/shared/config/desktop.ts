/**
 * Desktop mode config adapter — P3 Tauri spike.
 *
 * In desktop mode (Tauri), the backend URL is resolved via the native command
 * `get_backend_url` instead of relying on window.location or a hardcoded env var.
 *
 * In web mode this module is a no-op; consumers call `resolveApiBaseUrl()` which
 * falls back to the standard VITE_API_BASE_URL env logic.
 *
 * Usage:
 *   import { resolveApiBaseUrl } from '@/shared/config/desktop'
 *   const baseUrl = await resolveApiBaseUrl()
 */

/** Returns true when running inside a Tauri desktop shell. */
export function isDesktopMode(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Resolve the API base URL.
 *
 * Priority:
 * 1. Desktop mode → native `get_backend_url` command (returns http://127.0.0.1:{port})
 * 2. VITE_API_BASE_URL env var (set at build time)
 * 3. Empty string → relative URLs (same-origin, production web deployment)
 */
export async function resolveApiBaseUrl(): Promise<string> {
  if (isDesktopMode()) {
    try {
      // Use __TAURI_INTERNALS__.invoke directly to avoid a hard dependency on
      // @tauri-apps/api at build time — the package is only available in the
      // Tauri runtime, not in standard web builds.
      const tauri = window.__TAURI_INTERNALS__;
      if (tauri?.invoke) {
        const url: string = await tauri.invoke("get_backend_url");
        if (url) return url;
      }
    } catch {
      // Tauri invoke failed — fall through to env-based resolution
    }
  }
  return import.meta.env.VITE_API_BASE_URL ?? "";
}

/**
 * Synchronous fallback for contexts where async init isn't possible.
 * Desktop mode always returns the default port; web mode uses the env var.
 */
export function resolveApiBaseUrlSync(): string {
  if (isDesktopMode()) {
    return `http://127.0.0.1:${import.meta.env.VITE_DESKTOP_BACKEND_PORT ?? 8000}`;
  }
  return import.meta.env.VITE_API_BASE_URL ?? "";
}
