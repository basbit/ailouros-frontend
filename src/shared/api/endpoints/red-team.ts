import {
  parseRedTeamCorpusPayload,
  type RedTeamCorpus,
} from "@/shared/model/red-team-types";
import { ApiError, httpGet } from "@/shared/api/http";

export async function getRedTeamCorpus(): Promise<RedTeamCorpus> {
  const raw = await httpGet<Record<string, unknown>>("/v1/evaluation/red-team/probes");
  const parsed = parseRedTeamCorpusPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "red-team corpus returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
