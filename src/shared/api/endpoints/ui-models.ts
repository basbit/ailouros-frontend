import { httpGet } from "@/shared/api/http";
import type { paths } from "@/shared/api/openapi-types";

/**
 * `GET /v1/ui/models` — the models a local provider (ollama / lmstudio)
 * currently exposes.
 *
 * The query shape comes from the generated spec, so renaming or dropping
 * `provider` server-side breaks the build here. The 200 body is declared
 * `unknown` in the spec (the backend route is not response-modelled), hence the
 * hand-written `UiModelsResponse` plus the narrowing below: callers get a
 * `models` array they can iterate unconditionally instead of each re-deriving
 * `(data.models ?? [])`.
 */
type UiModelsQuery = paths["/v1/ui/models"]["get"]["parameters"]["query"];

interface UiModelEntry {
  id: string;
  label?: string;
}

export interface UiModelsResponse {
  models: UiModelEntry[];
  error?: string;
}

function readModels(payload: unknown): UiModelEntry[] {
  if (typeof payload !== "object" || payload === null) return [];
  const raw = (payload as { models?: unknown }).models;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is UiModelEntry =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as { id?: unknown }).id === "string",
  );
}

function readError(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const raw = (payload as { error?: unknown }).error;
  return typeof raw === "string" ? raw : undefined;
}

export async function listUiModels(
  provider: UiModelsQuery["provider"],
): Promise<UiModelsResponse> {
  const payload = await httpGet<unknown>(
    `/v1/ui/models?provider=${encodeURIComponent(provider)}`,
  );
  return { models: readModels(payload), error: readError(payload) };
}
