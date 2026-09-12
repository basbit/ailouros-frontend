import { httpGet } from "@/shared/api/http";
import type { ExternalHarness } from "../model/types";

export async function fetchExternalHarnesses(): Promise<ExternalHarness[]> {
  return httpGet<ExternalHarness[]>("/v1/agents/external/harnesses");
}
