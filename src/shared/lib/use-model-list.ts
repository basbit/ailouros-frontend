/**
 * Model list fetching for local and cloud providers.
 * No fallbacks — throws on any failure so the caller can show the error.
 */
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import { defaultRemoteApiBaseUrl } from "@/shared/lib/use-swarm-defaults";
import type { RemoteProfileRow } from "@/shared/store/projects";

const modelListCache: Record<string, [string, string][]> = {};

async function fetchModelsForProvider(provider: string): Promise<[string, string][]> {
  const { t } = useI18n();
  if (modelListCache[provider]) return modelListCache[provider];
  const r = await fetch(apiUrl("/ui/models?provider=" + encodeURIComponent(provider)));
  const j = (await r.json()) as {
    ok?: boolean;
    models?: { id: string; label?: string }[];
    error?: string;
  };
  if (!r.ok || !j.models?.length) {
    throw new Error(j.error ?? t("errors.noModelsForEnv", { provider }));
  }
  const pairs: [string, string][] = j.models.map((m) => [m.id, m.label ?? m.id]);
  pairs.push(["__custom__", "Custom…"]);
  modelListCache[provider] = pairs;
  return pairs;
}

export async function ensureModelChoicesForEnv(
  env: string,
): Promise<[string, string][]> {
  const { t } = useI18n();
  if (env === "ollama" || env === "lmstudio") {
    return fetchModelsForProvider(env);
  }
  throw new Error(t("errors.unknownEnv", { env }));
}

/** Fetch models for a cloud profile from the backend. Throws on any error. */
export async function fetchCloudModelsForProfile(
  profile: RemoteProfileRow,
): Promise<[string, string][]> {
  const { t } = useI18n();
  const prov = (profile.provider || "").trim().toLowerCase();
  if (!prov) throw new Error(t("errors.profileMissingProvider"));
  const baseUrl = (profile.base_url || defaultRemoteApiBaseUrl(prov) || "").trim();
  const apiKey = (profile.api_key || "").trim();

  const r = await fetch(apiUrl("/ui/remote-models"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: prov, base_url: baseUrl, api_key: apiKey }),
  });
  const j = (await r.json()) as {
    ok?: boolean;
    models?: { id: string; label?: string }[];
    error?: string;
  };
  if (!j.ok || !j.models?.length) {
    throw new Error(j.error ?? t("errors.noModelsForProvider", { provider: prov }));
  }
  const pairs: [string, string][] = j.models.map((m) => [m.id, m.label ?? m.id]);
  pairs.push(["__custom__", "Custom…"]);
  return pairs;
}
