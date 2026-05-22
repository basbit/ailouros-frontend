import { apiUrl } from "@/shared/api/base";
import { frontendLogger } from "@/shared/lib/frontend-logger";

interface RoleCatalogEntry {
  id: string;
  label: string;
  category: string;
  prompt_path: string;
  prompt_choices: [string, string][];
  model_defaults: Record<string, string>;
}

export interface RolesCatalog {
  version: number;
  default_environment: string;
  default_environment_desktop: string;
  model_placeholders: Record<string, string>;
  roles: RoleCatalogEntry[];
  remote_api_base_presets: Record<string, string>;
  remote_profile_provider_options: [string, string][];
  default_remote_api_provider: string;
}

const FALLBACK_TOMBSTONE_IDS: readonly string[] = ["pm", "dev", "qa"];

let _cachedCatalog: RolesCatalog | null = null;
let _cachedEtag: string | null = null;
let _inflight: Promise<RolesCatalog> | null = null;
let _tombstoneWarned = false;
const _onUpdate: Array<(catalog: RolesCatalog) => void> = [];

function _buildTombstoneCatalog(): RolesCatalog {
  return {
    version: 0,
    default_environment: "ollama",
    default_environment_desktop: "local",
    model_placeholders: { local: "local-default" },
    roles: FALLBACK_TOMBSTONE_IDS.map((id) => ({
      id,
      label: id.toUpperCase(),
      category: "",
      prompt_path: "",
      prompt_choices: [],
      model_defaults: {},
    })),
    remote_api_base_presets: {},
    remote_profile_provider_options: [],
    default_remote_api_provider: "anthropic",
  };
}

export function onRolesCatalogUpdate(handler: (catalog: RolesCatalog) => void): void {
  _onUpdate.push(handler);
}

export function getCachedRolesCatalog(): RolesCatalog {
  if (_cachedCatalog) return _cachedCatalog;
  if (!_tombstoneWarned) {
    _tombstoneWarned = true;
    frontendLogger.warn(
      "getCachedRolesCatalog: catalog not yet loaded; returning tombstone. " +
        "Ensure getRolesCatalog() is awaited during bootstrap.",
    );
  }
  return _buildTombstoneCatalog();
}

export async function getRolesCatalog(force = false): Promise<RolesCatalog> {
  if (!force && _cachedCatalog) return _cachedCatalog;
  if (_inflight) return _inflight;
  _inflight = (async () => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (_cachedEtag) {
      headers["If-None-Match"] = _cachedEtag;
    }
    const response = await fetch(apiUrl("/v1/roles/catalog"), { headers });
    if (response.status === 304 && _cachedCatalog) {
      return _cachedCatalog;
    }
    if (!response.ok) {
      throw new Error(`roles/catalog HTTP ${response.status}`);
    }
    const etag = response.headers.get("etag");
    const data = (await response.json()) as RolesCatalog;
    _cachedEtag = etag;
    _cachedCatalog = data;
    for (const handler of _onUpdate) {
      try {
        handler(data);
      } catch (err) {
        frontendLogger.warn("roles catalog update handler failed", err);
      }
    }
    return data;
  })();
  try {
    return await _inflight;
  } finally {
    _inflight = null;
  }
}

export function resetRolesCatalogCacheForTests(): void {
  _cachedCatalog = null;
  _cachedEtag = null;
  _inflight = null;
  _tombstoneWarned = false;
}
