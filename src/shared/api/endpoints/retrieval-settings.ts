import {
  parseRetrievalSettingsPayload,
  type RetrievalSettings,
} from "@/shared/model/retrieval-settings-types";
import { httpGet } from "@/shared/api/http";

export async function getRetrievalSettings(): Promise<RetrievalSettings | null> {
  const raw = await httpGet<Record<string, unknown>>("/v1/retrieval/settings");
  return parseRetrievalSettingsPayload(raw);
}
