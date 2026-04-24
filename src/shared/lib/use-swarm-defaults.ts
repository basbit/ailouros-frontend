/**
 * useSwarmDefaults — fetches model defaults and role-group mappings from the
 * backend `GET /v1/defaults` endpoint.
 *
 * Falls back to localStorage-cached values on network failure so that the UI
 * remains functional without a backend connection on initial load.
 *
 * The hardcoded constants in swarm-constants.ts are intentionally kept as a
 * fallback; this composable overlays them with server-authoritative values.
 */

import { ref, readonly } from "vue";
import { PIPELINE_DEFAULT_ORDER, ROLES } from "@/shared/lib/pipeline-schema";
import type { RoleId } from "@/shared/lib/pipeline-schema";
import {
  FALLBACK_MODEL_DEFAULTS,
  FALLBACK_PROMPT_CHOICES,
  FALLBACK_PROMPT_DEFAULTS,
  FALLBACK_REMOTE_API_BASE_PRESETS,
  FALLBACK_REMOTE_PROFILE_PROVIDER_OPTS,
} from "@/shared/lib/swarm-policy-fallbacks";

const LS_SWARM_DEFAULTS = "swarm_ui_defaults_v1";

export interface SwarmDefaults {
  roles: string[];
  model_defaults: Record<string, Record<string, string>>;
  prompt_defaults: Record<string, string>;
  prompt_choices: Record<string, [string, string][]>;
  remote_api_base_presets: Record<string, string>;
  remote_profile_provider_options: [string, string][];
  default_pipeline_order: string[];
  default_role_environment: string;
  default_remote_api_provider: string;
  default_swarm_provider: string;
}

function _loadFromStorage(): SwarmDefaults | null {
  try {
    const raw = localStorage.getItem(LS_SWARM_DEFAULTS);
    if (!raw) return null;
    return JSON.parse(raw) as SwarmDefaults;
  } catch {
    return null;
  }
}

function _saveToStorage(data: SwarmDefaults): void {
  try {
    localStorage.setItem(LS_SWARM_DEFAULTS, JSON.stringify(data));
  } catch {
    // storage quota exceeded — ignore
  }
}

function _hardcodedDefaults(): SwarmDefaults {
  return {
    roles: [...ROLES],
    model_defaults: Object.fromEntries(
      (ROLES as readonly string[]).map((r) => [
        r,
        (FALLBACK_MODEL_DEFAULTS[r as RoleId] ?? {}) as Record<string, string>,
      ]),
    ),
    prompt_defaults: { ...FALLBACK_PROMPT_DEFAULTS },
    prompt_choices: Object.fromEntries(
      (ROLES as readonly string[]).map((r) => [
        r,
        (FALLBACK_PROMPT_CHOICES[r as RoleId] ?? []) as [string, string][],
      ]),
    ),
    remote_api_base_presets: { ...FALLBACK_REMOTE_API_BASE_PRESETS },
    remote_profile_provider_options: [...FALLBACK_REMOTE_PROFILE_PROVIDER_OPTS],
    default_pipeline_order: [...PIPELINE_DEFAULT_ORDER],
    default_role_environment: "ollama",
    default_remote_api_provider: "anthropic",
    default_swarm_provider: "ollama",
  };
}

function _withHardcodedFallbacks(data: SwarmDefaults | null): SwarmDefaults {
  const fallback = _hardcodedDefaults();
  if (!data) return fallback;
  const roles = Array.from(new Set([...fallback.roles, ...(data.roles ?? [])]));
  return {
    ...fallback,
    ...data,
    roles,
    model_defaults: { ...fallback.model_defaults, ...(data.model_defaults ?? {}) },
    prompt_defaults: { ...fallback.prompt_defaults, ...(data.prompt_defaults ?? {}) },
    prompt_choices: { ...fallback.prompt_choices, ...(data.prompt_choices ?? {}) },
    remote_api_base_presets: {
      ...fallback.remote_api_base_presets,
      ...(data.remote_api_base_presets ?? {}),
    },
    remote_profile_provider_options: data.remote_profile_provider_options?.length
      ? data.remote_profile_provider_options
      : fallback.remote_profile_provider_options,
    default_pipeline_order: data.default_pipeline_order?.length
      ? data.default_pipeline_order
      : fallback.default_pipeline_order,
  };
}

const _defaults = ref<SwarmDefaults>(_withHardcodedFallbacks(_loadFromStorage()));
let _fetchPromise: Promise<void> | null = null;

async function _fetchDefaults(baseUrl: string): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/defaults`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`GET /v1/defaults returned ${resp.status}`);
  const data = (await resp.json()) as SwarmDefaults;
  if (
    !data ||
    !Array.isArray(data.roles) ||
    typeof data.model_defaults !== "object" ||
    typeof data.prompt_defaults !== "object" ||
    typeof data.prompt_choices !== "object" ||
    typeof data.remote_api_base_presets !== "object" ||
    !Array.isArray(data.remote_profile_provider_options) ||
    !Array.isArray(data.default_pipeline_order)
  ) {
    throw new Error("Malformed /v1/defaults response");
  }
  _defaults.value = _withHardcodedFallbacks(data);
  _saveToStorage(_defaults.value);
}

/**
 * Fetch (once) and return reactive swarm defaults.
 *
 * @param baseUrl  Origin of the orchestrator API, e.g. `""` (same-origin) or
 *                 `"http://localhost:8000"`.
 */
export function useSwarmDefaults(baseUrl = "") {
  if (_fetchPromise === null) {
    _fetchPromise = _fetchDefaults(baseUrl).catch((err) => {
      // Non-fatal: fall back to localStorage / hardcoded constants.
      console.warn("useSwarmDefaults: failed to fetch /v1/defaults —", err);
      _fetchPromise = null; // allow retry on next call
    });
  }
  return { defaults: readonly(_defaults) };
}

export function getStoredSwarmDefaults(): SwarmDefaults {
  return _defaults.value;
}

export function defaultEnvironmentForRole(): string {
  return getStoredSwarmDefaults().default_role_environment || "ollama";
}

export function defaultModelForRole(roleId: string, environment: string): string {
  return getStoredSwarmDefaults().model_defaults[roleId]?.[environment] ?? "";
}

export function defaultPromptPathForRole(roleId: string): string {
  return getStoredSwarmDefaults().prompt_defaults[roleId] ?? "";
}

export function promptChoicesForRole(roleId: string): [string, string][] {
  return (getStoredSwarmDefaults().prompt_choices[roleId] ?? []) as [string, string][];
}

export function defaultPipelineOrder(): string[] {
  return [...(getStoredSwarmDefaults().default_pipeline_order || [])];
}

export function defaultRemoteApiProvider(): string {
  return getStoredSwarmDefaults().default_remote_api_provider || "anthropic";
}

export function defaultRemoteApiBaseUrl(provider: string): string {
  return getStoredSwarmDefaults().remote_api_base_presets[provider] ?? "";
}

export function remoteProfileProviderOptions(): [string, string][] {
  return [...getStoredSwarmDefaults().remote_profile_provider_options];
}

export function defaultSwarmProvider(): string {
  return getStoredSwarmDefaults().default_swarm_provider || "ollama";
}
