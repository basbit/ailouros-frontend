<template>
  <section class="model-registry-pane">
    <PaneHeader
      :title="t('settings.modelRegistry.title')"
      :subtitle="t('settings.modelRegistry.subtitle')"
    />
    <div class="model-registry-pane__toolbar">
      <button
        type="button"
        class="model-registry-pane__btn"
        :disabled="loading"
        @click="onRefresh"
      >
        {{ loading ? "…" : t("settings.modelRegistry.refresh") }}
      </button>
      <span v-if="errors.length" class="model-registry-pane__warn">
        {{ errors.join("; ") }}
      </span>
    </div>

    <p v-if="!registry.length && !loading" class="model-registry-pane__empty">
      {{ t("settings.modelRegistry.empty") }}
    </p>

    <article
      v-for="provider in registry"
      :key="`${provider.env}:${provider.id}`"
      class="model-registry-pane__card"
    >
      <header class="model-registry-pane__card-head">
        <span class="model-registry-pane__provider">{{ provider.id }}</span>
        <span
          class="model-registry-pane__env-pill"
          :class="`model-registry-pane__env-pill--${provider.env}`"
        >
          {{
            provider.env === "local"
              ? t("settings.modelRegistry.local")
              : t("settings.modelRegistry.cloud")
          }}
        </span>
        <span class="model-registry-pane__model-count">
          {{ provider.models.length }}
        </span>
      </header>
      <ul class="model-registry-pane__models">
        <li
          v-for="model in provider.models"
          :key="`${provider.id}-${model.id}`"
          class="model-registry-pane__model-row"
        >
          <span class="model-registry-pane__model-id">{{ model.id }}</span>
          <span v-if="model.roles.length" class="model-registry-pane__model-roles">
            {{ t("settings.modelRegistry.usedBy", { roles: model.roles.join(", ") }) }}
          </span>
          <span v-else class="model-registry-pane__unused">
            {{ t("settings.modelRegistry.unused") }}
          </span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";
import { ApiError, httpGet } from "@/shared/api/http";

interface ModelEntry {
  id: string;
  roles: string[];
}

interface ProviderEntry {
  id: string;
  env: "local" | "cloud";
  models: ModelEntry[];
}

interface DiscoveredModelsResponse {
  models?: { id: string; label?: string }[];
  error?: string;
}

const settings = useInjectedAppSettings();
const { t } = useI18n();

const discovered = ref<Record<string, string[]>>({});
const loading = ref(false);
const errors = ref<string[]>([]);

async function discoverLocalProvider(provider: string): Promise<void> {
  try {
    const data = await httpGet<DiscoveredModelsResponse>(
      `/ui/models?provider=${encodeURIComponent(provider)}`,
    );
    const ids = (data.models ?? []).map((m) => m.id);
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
</script>

<style scoped>
.model-registry-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.model-registry-pane__toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.model-registry-pane__btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
}

.model-registry-pane__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-registry-pane__warn {
  color: var(--ink-3, #999);
  font-size: 12px;
}

.model-registry-pane__empty {
  margin: 0;
  padding: 18px;
  background: var(--card-soft);
  border-radius: var(--r-md);
  color: var(--ink-3);
  font-size: 13px;
}

.model-registry-pane__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.model-registry-pane__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-registry-pane__provider {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.model-registry-pane__env-pill {
  display: inline-flex;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.model-registry-pane__env-pill--local {
  background: var(--ok-soft, #e6f4ea);
  color: var(--ok, #1e7a3e);
}

.model-registry-pane__env-pill--cloud {
  background: var(--info-soft, #e7f0ff);
  color: var(--info, #1f5fcf);
}

.model-registry-pane__model-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-3);
}

.model-registry-pane__models {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-registry-pane__model-row {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  border-radius: var(--r-sm);
  background: var(--card-soft);
  font-size: 12px;
}

.model-registry-pane__model-id {
  font-family: var(--font-mono);
  color: var(--ink);
}

.model-registry-pane__model-roles {
  margin-left: auto;
  color: var(--ink-3);
}

.model-registry-pane__unused {
  margin-left: auto;
  color: var(--ink-3, #999);
  font-style: italic;
}
</style>
