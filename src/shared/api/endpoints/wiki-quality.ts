import { httpGet } from "@/shared/api/http";
import type { WikiQualityReport } from "@/shared/model/wiki-quality-types";

export async function getWikiQualityReport(
  workspaceRoot: string,
): Promise<WikiQualityReport> {
  const query = `?workspace_root=${encodeURIComponent(workspaceRoot)}`;
  return httpGet<WikiQualityReport>(`/v1/workspace/wiki-quality${query}`);
}
