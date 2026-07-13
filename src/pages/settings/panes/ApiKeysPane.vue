<template>
  <section class="api-keys-pane">
    <PaneHeader
      :title="t('settings.apiKeys.title')"
      :subtitle="t('settings.apiKeys.subtitle')"
    />

    <section class="api-keys-pane__card">
      <header class="api-keys-pane__card-head">
        <h3 class="api-keys-pane__card-title">
          {{ t("settings.apiKeys.providers") }}
        </h3>
        <p class="api-keys-pane__card-hint">
          {{ t("settings.apiKeys.providersHint") }}
        </p>
      </header>

      <div v-if="profiles.length" class="api-keys-pane__table">
        <div class="api-keys-pane__head">
          <span>{{ t("settings.apiKeys.colId") }}</span>
          <span>{{ t("settings.apiKeys.colProvider") }}</span>
          <span>{{ t("settings.apiKeys.colKey") }}</span>
          <span>{{ t("settings.apiKeys.colBaseUrl") }}</span>
          <span>{{ t("settings.apiKeys.colLimit") }}</span>
          <span aria-hidden="true" />
        </div>
        <div
          v-for="(profile, index) in profiles"
          :key="index"
          class="api-keys-pane__row"
        >
          <input
            type="text"
            class="api-keys-pane__input"
            :value="profile.id"
            @input="onProfileUpdate(index, 'id', $event)"
          />
          <select
            class="api-keys-pane__input"
            :value="profile.provider"
            @change="onProfileUpdate(index, 'provider', $event)"
          >
            <option
              v-for="option in PROVIDER_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
          <input
            type="password"
            autocomplete="off"
            class="api-keys-pane__input"
            :value="profile.api_key"
            @input="onProfileUpdate(index, 'api_key', $event)"
          />
          <input
            type="text"
            class="api-keys-pane__input"
            :value="profile.base_url"
            @input="onProfileUpdate(index, 'base_url', $event)"
          />
          <span class="api-keys-pane__balance" :title="balanceTitle(profile)">
            {{ balanceText(profile) }}
          </span>
          <button
            type="button"
            class="api-keys-pane__remove"
            :aria-label="t('settings.apiKeys.remove')"
            @click="onRemoveProfile(index)"
          >
            ×
          </button>
        </div>
      </div>
      <p v-else class="api-keys-pane__empty">
        {{ t("settings.apiKeys.empty") }}
      </p>

      <button type="button" class="api-keys-pane__add" @click="onAddProfile">
        + {{ t("settings.apiKeys.add") }}
      </button>
      <button
        v-if="profiles.length"
        type="button"
        class="api-keys-pane__add"
        @click="refreshBalances"
      >
        {{ t("settings.apiKeys.refreshLimits") }}
      </button>
    </section>

    <section class="api-keys-pane__card">
      <header class="api-keys-pane__card-head">
        <h3 class="api-keys-pane__card-title">
          {{ t("settings.apiKeys.searchTokens") }}
        </h3>
      </header>
      <div class="api-keys-pane__token-row">
        <span class="api-keys-pane__token-label">
          {{ t("settings.apiKeys.tavily") }}
        </span>
        <input
          type="password"
          autocomplete="off"
          class="api-keys-pane__input"
          :value="globalSettings.state.tavily_api_key"
          @input="onSetSearchKey('tavily_api_key', $event)"
        />
      </div>
      <div class="api-keys-pane__token-row">
        <span class="api-keys-pane__token-label">
          {{ t("settings.apiKeys.exa") }}
        </span>
        <input
          type="password"
          autocomplete="off"
          class="api-keys-pane__input"
          :value="globalSettings.state.exa_api_key"
          @input="onSetSearchKey('exa_api_key', $event)"
        />
      </div>
      <div class="api-keys-pane__token-row">
        <span class="api-keys-pane__token-label">
          {{ t("settings.apiKeys.scrapingdog") }}
        </span>
        <input
          type="password"
          autocomplete="off"
          class="api-keys-pane__input"
          :value="globalSettings.state.scrapingdog_api_key"
          @input="onSetSearchKey('scrapingdog_api_key', $event)"
        />
      </div>
      <div class="api-keys-pane__token-row">
        <span class="api-keys-pane__token-label">
          {{ t("settings.apiKeys.githubToken") }}
        </span>
        <input
          type="password"
          autocomplete="off"
          class="api-keys-pane__input"
          :value="globalSettings.state.github_token"
          @input="onSetSearchKey('github_token', $event)"
        />
      </div>
      <p class="api-keys-pane__token-hint">
        {{ t("settings.apiKeys.codeHostingHint") }}
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import type { RemoteProfileRow } from "@/entities/remote-profile";
import { useProviderBalances } from "@/features/remote-api/useProviderBalances";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useInjectedGlobalSettings } from "@/features/global-settings/globalSettingsContext";
import { useI18n } from "@/shared/lib/i18n";

type GlobalKey =
  | "tavily_api_key"
  | "exa_api_key"
  | "scrapingdog_api_key"
  | "github_token";

const settings = useInjectedAppSettings();
const globalSettings = useInjectedGlobalSettings();
const { t } = useI18n();

const profiles = computed(() => settings.profilesState.profiles.value);

const balances = useProviderBalances();

function refreshBalances(): void {
  void balances.refreshAll(profiles.value);
}

onMounted(refreshBalances);

function balanceText(profile: RemoteProfileRow): string {
  const entry = balances.entryFor(profile);
  if (!entry || entry.loading) return "…";
  const balance = entry.balance;
  if (!balance || balance.status === "error") return "—";
  if (balance.status === "ok" && balance.limit_remaining != null) {
    return String(balance.limit_remaining);
  }
  return t("settings.apiKeys.balanceUnknown");
}

function balanceTitle(profile: RemoteProfileRow): string {
  const entry = balances.entryFor(profile);
  const balance = entry?.balance;
  if (!entry || entry.loading) return t("settings.apiKeys.balanceLoadingHint");
  if (!balance || balance.status === "error") {
    return t("settings.apiKeys.balanceErrorHint");
  }
  if (balance.status === "ok" && balance.limit_remaining != null) {
    return t("settings.apiKeys.balanceRemainingHint");
  }
  return t("settings.apiKeys.balanceUnknownHint");
}

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google (Gemini)" },
  { value: "azure_openai", label: "Azure OpenAI" },
  { value: "vertex_ai", label: "Google Vertex AI" },
  { value: "bedrock", label: "AWS Bedrock" },
  { value: "groq", label: "Groq" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "fireworks_ai", label: "Fireworks AI" },
  { value: "together_ai", label: "Together AI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "ollama_cloud", label: "Ollama Cloud" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "lmstudio", label: "LM Studio (local)" },
  { value: "litellm", label: "LiteLLM proxy" },
  { value: "custom", label: "Custom / OpenAI-compatible" },
] as const;

function readInputValue(event: Event): string {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  return target.value;
}

function onProfileUpdate(
  index: number,
  field: keyof RemoteProfileRow,
  event: Event,
): void {
  settings.profilesState.updateProfile(index, field, readInputValue(event));
  settings.rolesState.refreshAllProfileSelects();
}

function onAddProfile(): void {
  settings.profilesState.addProfile();
}

function onRemoveProfile(index: number): void {
  settings.profilesState.removeProfile(index);
}

function onSetSearchKey(key: GlobalKey, event: Event): void {
  globalSettings.setKey(key, readInputValue(event));
}
</script>

<style scoped>
.api-keys-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 960px;
}

.api-keys-pane__card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}

.api-keys-pane__card-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.api-keys-pane__card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.api-keys-pane__card-hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}

.api-keys-pane__table {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.api-keys-pane__head,
.api-keys-pane__row {
  display: grid;
  grid-template-columns: 120px 120px minmax(0, 1fr) minmax(0, 1fr) 128px 28px;
  gap: 8px;
  align-items: center;
}

.api-keys-pane__balance {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--ink-3);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.api-keys-pane__head {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  padding: 0 4px;
}

.api-keys-pane__input {
  appearance: none;
  width: 100%;
  padding: 7px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--bg-2);
  color: var(--ink);
  font-size: 12px;
  font-family: var(--font-mono);
}

.api-keys-pane__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-glow);
}

.api-keys-pane__remove {
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 1px solid transparent;
  background: transparent;
  color: var(--ink-3);
  font-size: 14px;
  cursor: pointer;
}

.api-keys-pane__remove:hover {
  background: color-mix(in srgb, var(--error) 12%, transparent);
  color: var(--error);
}

.api-keys-pane__empty {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

.api-keys-pane__add {
  appearance: none;
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px dashed var(--line-strong);
  background: transparent;
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
}

.api-keys-pane__add:hover {
  border-color: var(--accent);
  color: var(--accent-2);
}

.api-keys-pane__token-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 12px;
  align-items: center;
}

.api-keys-pane__token-label {
  font-size: 12px;
  color: var(--ink-2);
  font-weight: 500;
}

.api-keys-pane__token-hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}
</style>
