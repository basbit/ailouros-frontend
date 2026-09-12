import { computed, onMounted, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import { listUiModels } from "@/shared/api/endpoints/ui-models";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";

interface ModelEntry {
  id: string;
  roles: string[];
}

export interface ProviderEntry {
  id: string;
  env: "local" | "cloud";
  models: ModelEntry[];
}

interface RoleState {
  environment: string;
  modelSel: string;
  modelCustom: string;
  remoteProfile?: string;
}

const CUSTOM_MODEL_SENTINEL = "__custom__";
const LMSTUDIO_PROVIDER_ID = "lmstudio";
const DEFAULT_LOCAL_PROVIDER_ID = "ollama";
const LOCAL_ENVIRONMENT_IDS: ReadonlySet<string> = new Set([
  "local",
  DEFAULT_LOCAL_PROVIDER_ID,
  LMSTUDIO_PROVIDER_ID,
]);

function ensureProvider(
  registryMap: Map<string, ProviderEntry>,
  env: "local" | "cloud",
  id: string,
): ProviderEntry {
  const key = `${env}:${id}`;
  let entry = registryMap.get(key);
  if (!entry) {
    entry = { id, env, models: [] };
    registryMap.set(key, entry);
  }
  return entry;
}

function ensureModel(provider: ProviderEntry, id: string): ModelEntry {
  const existing = provider.models.find((candidate) => candidate.id === id);
  if (existing) return existing;
  const created: ModelEntry = { id, roles: [] };
  provider.models.push(created);
  return created;
}

function resolveRoleModelId(state: RoleState): string {
  if (state.modelSel === CUSTOM_MODEL_SENTINEL) {
    return (state.modelCustom || "").trim();
  }
  return (state.modelSel || "").trim();
}

function resolveLocalProviderIdForEnvironment(environment: string): string {
  return environment === LMSTUDIO_PROVIDER_ID
    ? LMSTUDIO_PROVIDER_ID
    : DEFAULT_LOCAL_PROVIDER_ID;
}

function resolveRoleProvider(
  state: RoleState,
  profileIndex: Map<string, string>,
): { env: "local" | "cloud"; providerId: string } | null {
  if (LOCAL_ENVIRONMENT_IDS.has(state.environment)) {
    return {
      env: "local",
      providerId: resolveLocalProviderIdForEnvironment(state.environment),
    };
  }
  if (!state.remoteProfile) return null;
  const providerId = profileIndex.get(state.remoteProfile) ?? state.remoteProfile;
  return { env: "cloud", providerId };
}

function buildProfileIndex(
  profiles: { id?: string; provider?: string }[],
): Map<string, string> {
  const profileIndex = new Map<string, string>();
  for (const profile of profiles) {
    if (profile.id) profileIndex.set(profile.id, profile.provider || profile.id);
  }
  return profileIndex;
}

function applyDiscoveredLocalProviders(
  registryMap: Map<string, ProviderEntry>,
  discoveredByProvider: Record<string, string[]>,
): void {
  for (const [providerId, modelIds] of Object.entries(discoveredByProvider)) {
    if (!modelIds.length) continue;
    const provider = ensureProvider(registryMap, "local", providerId);
    for (const modelId of modelIds) ensureModel(provider, modelId);
  }
}

function applyCloudProviderProfiles(
  registryMap: Map<string, ProviderEntry>,
  profiles: { id?: string; provider?: string }[],
): void {
  for (const profile of profiles) {
    if (!profile.id) continue;
    ensureProvider(registryMap, "cloud", profile.provider || profile.id);
  }
}

function applyRoleAssignments(
  registryMap: Map<string, ProviderEntry>,
  roles: Record<string, RoleState>,
  profileIndex: Map<string, string>,
): void {
  for (const [roleId, state] of Object.entries(roles)) {
    const modelId = resolveRoleModelId(state);
    if (!modelId) continue;
    const resolution = resolveRoleProvider(state, profileIndex);
    if (!resolution) continue;
    const provider = ensureProvider(registryMap, resolution.env, resolution.providerId);
    const model = ensureModel(provider, modelId);
    if (!model.roles.includes(roleId)) model.roles.push(roleId);
  }
}

function sortRegistryEntries(entries: ProviderEntry[]): ProviderEntry[] {
  return entries.sort((left, right) => {
    if (left.env !== right.env) return left.env === "local" ? -1 : 1;
    return left.id.localeCompare(right.id);
  });
}

export function useModelRegistry(): {
  registry: ComputedRef<ProviderEntry[]>;
  loading: Ref<boolean>;
  errors: Ref<string[]>;
  onRefresh: () => void;
} {
  const settings = useInjectedAppSettings();
  const discovered = ref<Record<string, string[]>>({});
  const loading = ref(false);
  const errors = ref<string[]>([]);

  async function discoverLocalProvider(provider: string): Promise<void> {
    try {
      const data = await listUiModels(provider);
      const ids = data.models.map((m) => m.id);
      discovered.value = { ...discovered.value, [provider]: ids };
    } catch (err) {
      let detail = "";
      if (err instanceof ApiError) detail = `${provider}: ${err.status}`;
      else if (err instanceof Error) detail = `${provider}: ${err.message}`;
      if (detail) errors.value.push(detail);
    }
  }

  async function refresh(): Promise<void> {
    loading.value = true;
    errors.value = [];
    try {
      await Promise.all([
        discoverLocalProvider("ollama"),
        discoverLocalProvider("lmstudio"),
      ]);
    } finally {
      loading.value = false;
    }
  }

  function onRefresh(): void {
    void refresh();
  }

  onMounted(() => {
    void refresh();
  });

  const registry = computed<ProviderEntry[]>(() => {
    const registryMap = new Map<string, ProviderEntry>();
    const profiles = settings.profilesState.profiles.value;
    const profileIndex = buildProfileIndex(profiles);
    applyDiscoveredLocalProviders(registryMap, discovered.value);
    applyCloudProviderProfiles(registryMap, profiles);
    applyRoleAssignments(
      registryMap,
      settings.rolesState.roleStates as Record<string, RoleState>,
      profileIndex,
    );
    return sortRegistryEntries(Array.from(registryMap.values()));
  });

  return { registry, loading, errors, onRefresh };
}
