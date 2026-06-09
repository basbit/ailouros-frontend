import { httpGet } from "@/shared/api/http";

interface CapabilityProbe {
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
  return httpGet<RuntimeCapabilitiesResponse>("/v1/runtime/capabilities");
}
