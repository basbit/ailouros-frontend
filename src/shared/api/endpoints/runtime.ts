import { fetchJson } from "@/shared/api/client";

export interface CapabilityProbe {
  name: string;
  ready: boolean;
  detail: string;
}

export interface RuntimeCapabilitiesResponse {
  probes: CapabilityProbe[];
  ready: number;
  total: number;
}

export async function getRuntimeCapabilities(): Promise<RuntimeCapabilitiesResponse> {
  return fetchJson<RuntimeCapabilitiesResponse>("/v1/runtime/capabilities");
}
