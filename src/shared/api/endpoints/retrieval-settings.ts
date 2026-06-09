import {
  parseRetrievalSettingsPayload,
  type RetrievalSettings,
} from "@/shared/model/retrieval-settings-types";
import { ApiError, httpGet } from "@/shared/api/http";

export async function getRetrievalSettings(): Promise<RetrievalSettings> {
  const raw = await httpGet<Record<string, unknown>>("/v1/retrieval/settings");
  const parsed = parseRetrievalSettingsPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "retrieval settings returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
