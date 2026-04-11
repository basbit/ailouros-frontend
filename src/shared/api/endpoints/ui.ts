import { fetchJson } from "@/shared/api/client";

export interface UiModelRow {
  id: string;
  label?: string;
}

export interface UiModelsResponse {
  models?: UiModelRow[];
}

export async function getUiModels(
  provider: "ollama" | "lmstudio",
): Promise<UiModelsResponse> {
  const q = new URLSearchParams({ provider });
  return fetchJson<UiModelsResponse>(`/ui/models?${q.toString()}`);
}

export interface UiRemoteModelsBody {
  provider: string;
  base_url: string;
  api_key?: string;
}

export interface UiRemoteModelsResponse {
  models?: UiModelRow[];
}

export async function postUiRemoteModels(
  body: UiRemoteModelsBody,
): Promise<UiRemoteModelsResponse> {
  return fetchJson<UiRemoteModelsResponse>("/ui/remote-models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
