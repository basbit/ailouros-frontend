interface BackendInfo {
  url: string;
  port: number;
}

function isDesktopMode(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

async function invokeGetBackendUrl(): Promise<BackendInfo | null> {
  try {
    const core = await import("@tauri-apps/api/core");
    const info = await core.invoke<BackendInfo>("get_backend_url");
    return info ?? null;
  } catch {
    return null;
  }
}

const POLL_INTERVAL_MS = 500;
const POLL_MAX_MS = 60_000;

export async function resolveApiBaseUrl(): Promise<string> {
  if (isDesktopMode()) {
    const start = Date.now();
    while (Date.now() - start < POLL_MAX_MS) {
      const info = await invokeGetBackendUrl();
      if (info && info.port > 0 && info.url) return info.url;
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
    const fallback = await invokeGetBackendUrl();
    if (fallback?.url) return fallback.url;
  }
  return import.meta.env.VITE_API_BASE_URL ?? "";
}
