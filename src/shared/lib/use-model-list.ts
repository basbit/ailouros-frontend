import { ApiError, httpGet, httpPost } from "@/shared/api/http";
import { useI18n } from "@/shared/lib/i18n";
import { defaultRemoteApiBaseUrl } from "@/shared/lib/use-swarm-defaults";
import type { RemoteProfileRow } from "@/shared/model/remote-profile-types";

interface ModelListResponse {
  ok?: boolean;
  models?: { id: string; label?: string }[];
  error?: string;
}

function extractErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || !err.body) return null;
  try {
    const parsed = JSON.parse(err.body) as { error?: string };
    return parsed?.error ?? null;
  } catch {
    return null;
  }
}

type ModelPairs = [string, string][];

/**
 * One request per catalog key at a time, whoever asks. The Agent models pane
 * mounts a card per role and every card asked for the same list: 8× the
 * local GET and 17× the cloud POST, in parallel, each hitting the provider.
 */
class ModelCatalogCache {
  private readonly resolved = new Map<string, ModelPairs>();
  private readonly inflight = new Map<string, Promise<ModelPairs>>();

  get(key: string, load: () => Promise<ModelPairs>): Promise<ModelPairs> {
    const cached = this.resolved.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const request = load()
      .then((pairs) => {
        this.resolved.set(key, pairs);
        return pairs;
      })
      .finally(() => {
        this.inflight.delete(key);
      });
    this.inflight.set(key, request);
    return request;
  }

  clear(): void {
    this.resolved.clear();
    this.inflight.clear();
  }
}

const localModelCatalog = new ModelCatalogCache();
const cloudModelCatalog = new ModelCatalogCache();

/** Test seam: forget every cached and in-flight catalog. */
export function resetModelListCache(): void {
  localModelCatalog.clear();
  cloudModelCatalog.clear();
}

export interface CloudModelSource {
  provider: string;
  base_url?: string;
  api_key?: string;
}

function withCustomOption(models: { id: string; label?: string }[]): ModelPairs {
  const pairs: ModelPairs = models.map((m) => [m.id, m.label ?? m.id]);
  pairs.push(["__custom__", "Custom…"]);
  return pairs;
}

async function fetchModelsForProvider(provider: string): Promise<ModelPairs> {
  const { t } = useI18n();
  return localModelCatalog.get(provider, async () => {
    let j: ModelListResponse;
    try {
      j = await httpGet<ModelListResponse>(
        "/v1/ui/models?provider=" + encodeURIComponent(provider),
      );
    } catch (err) {
      const backendError = extractErrorMessage(err);
      throw new Error(backendError ?? t("errors.noModelsForEnv", { provider }));
    }
    if (!j.models?.length) {
      throw new Error(j.error ?? t("errors.noModelsForEnv", { provider }));
    }
    return withCustomOption(j.models);
  });
}

export async function ensureModelChoicesForEnv(
  env: string,
): Promise<[string, string][]> {
  const { t } = useI18n();
  if (env === "ollama" || env === "lmstudio" || env === "local") {
    return fetchModelsForProvider(env);
  }
  throw new Error(t("errors.unknownEnv", { env }));
}

export async function fetchCloudModelsFromConnection(
  source: CloudModelSource,
): Promise<[string, string][]> {
  const { t } = useI18n();
  const prov = (source.provider || "").trim().toLowerCase();
  if (!prov) throw new Error(t("errors.profileMissingProvider"));
  const baseUrl = (source.base_url || defaultRemoteApiBaseUrl(prov) || "").trim();
  const apiKey = (source.api_key || "").trim();
  // The key is part of the identity (a different key may see different
  // models) but never of anything logged: the cache key stays in memory.
  const cacheKey = JSON.stringify([prov, baseUrl, apiKey]);

  return cloudModelCatalog.get(cacheKey, async () => {
    let j: ModelListResponse;
    try {
      j = await httpPost<ModelListResponse>("/v1/ui/remote-models", {
        provider: prov,
        base_url: baseUrl,
        api_key: apiKey,
      });
    } catch (err) {
      const backendError = extractErrorMessage(err);
      throw new Error(
        backendError ?? t("errors.noModelsForProvider", { provider: prov }),
      );
    }
    if (!j.ok || !j.models?.length) {
      throw new Error(j.error ?? t("errors.noModelsForProvider", { provider: prov }));
    }
    return withCustomOption(j.models);
  });
}

export async function fetchCloudModelsForProfile(
  profile: RemoteProfileRow,
): Promise<[string, string][]> {
  return fetchCloudModelsFromConnection(profile);
}
