import { httpGet } from "@/shared/api/http";

export type HealthStatus = "ok" | "degraded" | "error" | "disabled";

export interface SubsystemHealth {
  subsystem: string;
  status: HealthStatus;
  latency_ms: number;
  detail: string;
  metadata: Record<string, string>;
}

export interface SystemHealth {
  status: HealthStatus;
  subsystems: SubsystemHealth[];
}

export async function getHealth(signal?: AbortSignal): Promise<SystemHealth> {
  return httpGet<SystemHealth>("/v1/health", { signal });
}
