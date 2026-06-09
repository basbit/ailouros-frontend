import {
  parseArtefactReportPayload,
  type ArtefactCatalogueReport,
} from "@/shared/model/artefact-catalogue-types";
import { ApiError, httpGet } from "@/shared/api/http";

export interface GetArtefactReportInput {
  scenario: string;
  workspaceRoot: string;
}

export async function getArtefactReport(
  input: GetArtefactReportInput,
): Promise<ArtefactCatalogueReport> {
  const params = new URLSearchParams({
    scenario: input.scenario,
    workspace_root: input.workspaceRoot,
  });
  const raw = await httpGet<Record<string, unknown>>(
    `/v1/orchestration/artefacts?${params.toString()}`,
  );
  const parsed = parseArtefactReportPayload(raw);
  if (!parsed) {
    throw new ApiError(
      "artefact-catalogue returned a malformed payload",
      200,
      JSON.stringify(raw),
    );
  }
  return parsed;
}
