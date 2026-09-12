import { httpGet } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";

export type RuntimeCapabilitiesResponse =
  paths["/v1/runtime/capabilities"]["get"]["responses"][200]["content"]["application/json"];

export async function getRuntimeCapabilities(): Promise<RuntimeCapabilitiesResponse> {
  return httpGet<RuntimeCapabilitiesResponse>("/v1/runtime/capabilities");
}
