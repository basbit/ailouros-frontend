import { SWARM_PUBLIC_API_BASE } from "@/shared/config";

/** Build an absolute API URL; set VITE_API_BASE_URL for cross-origin deployments. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const b = SWARM_PUBLIC_API_BASE;
  return b ? `${b}${p}` : p;
}
