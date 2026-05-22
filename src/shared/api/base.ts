import { SWARM_PUBLIC_API_BASE } from "@/shared/config";
import { resolveApiBaseUrl } from "@/shared/config/desktop";

let runtimeApiBase: string = SWARM_PUBLIC_API_BASE;
let initPromise: Promise<void> | null = null;

async function runInit(): Promise<void> {
  const resolved = await resolveApiBaseUrl();
  if (resolved) runtimeApiBase = resolved.replace(/\/$/, "");
}

export function initApiBase(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = runInit();
  return initPromise;
}

export function getApiBaseUrl(): string {
  return runtimeApiBase;
}

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const b = runtimeApiBase;
  return b ? `${b}${p}` : p;
}
