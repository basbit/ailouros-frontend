import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { initApiBase, getApiBaseUrl } from "@/shared/api/base";
import { httpRequestRaw } from "@/shared/api/http";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import "@/app/styles/app.css";

const HEALTH_POLL_INTERVAL_MS = 250;
const HEALTH_POLL_DEADLINE_MS = 60_000;

function updateBootstrapMessage(message: string): void {
  if (typeof document === "undefined") return;
  const node = document.getElementById("ailouros-bootstrap-message");
  if (node) node.textContent = message;
}

function hideBootstrap(): void {
  if (typeof document === "undefined") return;
  const overlay = document.getElementById("ailouros-bootstrap");
  if (!overlay) return;
  overlay.dataset.hidden = "1";
  window.setTimeout(() => overlay.remove(), 260);
}

async function probeBackendHealth(deadlineMs: number): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < deadlineMs) {
    const base = getApiBaseUrl();
    if (base) {
      try {
        // `/health` lives outside the API mount prefix, so use rawPath
        // against the resolved base URL. httpRequestRaw throws ApiError on
        // non-2xx, which we treat the same as a network failure (keep polling).
        await httpRequestRaw("GET", `${base}/health`, undefined, { rawPath: true });
        return true;
      } catch {
        /* keep polling */
      }
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_POLL_INTERVAL_MS));
  }
  return false;
}

async function bootstrap(): Promise<void> {
  const desktop = isDesktop();

  if (desktop) {
    updateBootstrapMessage("Connecting to runtime…");
    await initApiBase();
    updateBootstrapMessage("Waiting for backend…");
    const healthy = await probeBackendHealth(HEALTH_POLL_DEADLINE_MS);
    if (!healthy) {
      updateBootstrapMessage("Backend did not respond — opening anyway");
    }
  } else {
    initApiBase();
  }

  createApp(App).use(createPinia()).mount("#app");
  hideBootstrap();
}

bootstrap();
