import { httpGet, httpPost } from "@/shared/api/http";
import type {
  PromptLibraryCatalog,
  PromptTemplateDetail,
  RenderedPrompt,
} from "@/shared/model/prompt-library-types";

export interface PromptLibraryListResponse extends PromptLibraryCatalog {
  version: number;
}

export async function listPromptTemplates(): Promise<PromptLibraryListResponse> {
  return httpGet<PromptLibraryListResponse>("/v1/prompt-library/templates");
}

export async function getPromptTemplate(id: string): Promise<PromptTemplateDetail> {
  return httpGet<PromptTemplateDetail>(
    `/v1/prompt-library/templates/${encodeURIComponent(id)}`,
  );
}

export async function renderPromptTemplate(
  id: string,
  inputs: Record<string, string>,
): Promise<RenderedPrompt> {
  return httpPost<RenderedPrompt>(
    `/v1/prompt-library/templates/${encodeURIComponent(id)}/render`,
    { inputs },
  );
}
