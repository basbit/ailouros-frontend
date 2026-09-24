import { ref, readonly } from "vue";
import { initApiBase } from "@/shared/api/base";
import { httpGet } from "@/shared/api/http";
import { typedSwarmDefaults } from "@/shared/lib/storage-keys";
import { readTypedJson, writeTypedJson } from "@/shared/lib/persistence-adapter";

interface SwarmDefaults {
  roles: string[];
  model_defaults: Record<string, Record<string, string>>;
  prompt_defaults: Record<string, string>;
  prompt_choices: Record<string, [string, string][]>;
  remote_api_base_presets: Record<string, string>;
  remote_profile_provider_options: [string, string][];
  default_pipeline_order: string[];
  step_dependencies: Record<string, string[]>;
  default_role_environment: string;
  default_remote_api_provider: string;
  default_swarm_provider: string;
}

function _loadFromStorage(): SwarmDefaults | null {
  return readTypedJson(typedSwarmDefaults<SwarmDefaults>());
}

function _saveToStorage(data: SwarmDefaults): void {
  writeTypedJson(typedSwarmDefaults<SwarmDefaults>(), data);
}

function _emptyDefaults(): SwarmDefaults {
  return {
    roles: [],
    model_defaults: {},
    prompt_defaults: {},
    prompt_choices: {},
    remote_api_base_presets: {},
    remote_profile_provider_options: [],
    default_pipeline_order: [],
    step_dependencies: {},
    default_role_environment: "",
    default_remote_api_provider: "",
    default_swarm_provider: "",
  };
}

function _normalize(data: SwarmDefaults | null): SwarmDefaults {
  if (!data) return _emptyDefaults();
  const empty = _emptyDefaults();
  return {
    ...empty,
    ...data,
    roles: Array.isArray(data.roles) ? data.roles : [],
    model_defaults:
      data.model_defaults && typeof data.model_defaults === "object"
        ? data.model_defaults
        : {},
    prompt_defaults:
      data.prompt_defaults && typeof data.prompt_defaults === "object"
        ? data.prompt_defaults
        : {},
    prompt_choices:
      data.prompt_choices && typeof data.prompt_choices === "object"
        ? data.prompt_choices
        : {},
    remote_api_base_presets:
      data.remote_api_base_presets && typeof data.remote_api_base_presets === "object"
        ? data.remote_api_base_presets
        : {},
    remote_profile_provider_options: Array.isArray(data.remote_profile_provider_options)
      ? data.remote_profile_provider_options
      : [],
    default_pipeline_order: Array.isArray(data.default_pipeline_order)
      ? data.default_pipeline_order
      : [],
    step_dependencies:
      data.step_dependencies && typeof data.step_dependencies === "object"
        ? data.step_dependencies
        : {},
  };
}

const _defaults = ref<SwarmDefaults>(_normalize(_loadFromStorage()));
let _fetchPromise: Promise<void> | null = null;

async function _fetchDefaults(): Promise<void> {
  await initApiBase();
  const data = await httpGet<SwarmDefaults>("/v1/defaults", {
    headers: { "Cache-Control": "no-cache" },
  });
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
  _defaults.value = _normalize(data);
  _saveToStorage(_defaults.value);
}

export function useSwarmDefaults() {
  if (_fetchPromise === null) {
    _fetchPromise = _fetchDefaults();
    _fetchPromise.finally(() => {
      _fetchPromise = null;
    });
  }
  return { defaults: readonly(_defaults) };
}

/**
 * Raw `/v1/defaults` snapshot as last fetched (or restored from storage).
 *
 * This module is the transport + storage adapter for that resource only.
 * Domain readers over the payload live in the owning slices:
 * role defaults in `@/entities/role`, pipeline order and step dependencies
 * in `@/entities/pipeline`.
 */
export function swarmDefaultsSnapshot(): SwarmDefaults {
  return _defaults.value;
}

export function defaultRemoteApiProvider(): string {
  return swarmDefaultsSnapshot().default_remote_api_provider;
}

export function defaultRemoteApiBaseUrl(provider: string): string {
  return swarmDefaultsSnapshot().remote_api_base_presets[provider] ?? "";
}

export function remoteProfileProviderOptions(): [string, string][] {
  return [...swarmDefaultsSnapshot().remote_profile_provider_options];
}
