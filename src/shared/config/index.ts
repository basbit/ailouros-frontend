export const SWARM_PUBLIC_API_BASE: string = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

/** Optional build-time bearer token; the runtime value lives in @/shared/api/token. */
export const SWARM_PUBLIC_API_TOKEN: string = (
  import.meta.env.VITE_API_TOKEN ?? ""
).trim();
