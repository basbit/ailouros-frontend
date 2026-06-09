import {
  parseResolvedCitationPayload,
  type ResolvedCitation,
} from "@/shared/model/resolved-citation-types";
import { ApiError, httpGet } from "@/shared/api/http";

interface ResolveCitationResponse {
  chunk_id?: string;
  rel_path?: string;
  section?: string;
  anchor?: string;
  snippet?: string;
  found?: boolean;
}

export interface ResolveCitationOptions {
  chunkId: string;
  workspaceRoot?: string | null;
  signal?: AbortSignal;
}

export async function resolveCitation(
  options: ResolveCitationOptions,
): Promise<ResolvedCitation> {
  const params = new URLSearchParams({ chunk_id: options.chunkId });
  if (options.workspaceRoot) params.set("workspace_root", options.workspaceRoot);
  const raw = await httpGet<ResolveCitationResponse>(
    `/v1/citations/resolve?${params.toString()}`,
    { signal: options.signal },
  );
  const parsed = parseResolvedCitationPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "citations.resolve returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
