<template>
  <details class="section section-remote-api-global">
    <summary>
      {{ t("remoteApi.summary") }}
      <span
        class="scope-badge scope-badge-global"
        :title="t('remoteApi.allProjectsTitle')"
        >{{ t("remoteApi.allProjects") }}</span
      >
    </summary>
    <div class="section-body section-body-remote-api">
      <div class="hint hint-remote-global">
        {{ t("remoteApi.hint") }} {{ t("remoteApi.hintCache") }}
        <code>POST /ui/remote-models</code>. <strong>Gemini:</strong> base —
        <code>…/v1beta/openai/</code>.
      </div>
      <div class="remote-providers-card">
        <div class="remote-providers-card-title">{{ t("remoteApi.connected") }}</div>
        <div class="field remote-profiles-block">
          <div class="remote-profiles-head">
            <span>{{ t("remoteApi.profileId") }}</span>
            <span>{{ t("remoteApi.provider") }}</span>
            <span>{{ t("remoteApi.apiKey") }}</span>
            <span>{{ t("remoteApi.baseUrl") }}</span>
            <span>{{ t("remoteApi.limit") }}</span>
            <span></span>
          </div>
          <div class="remote-profiles-rows">
            <div
              v-for="(profile, idx) in profiles"
              :key="idx"
              class="remote-profile-row"
            >
              <input
                type="text"
                class="rprof-id"
                placeholder="e.g. gemini_fast"
                autocomplete="off"
                :value="profile.id"
                @input="onUpdate(idx, 'id', ($event.target as HTMLInputElement).value)"
              />
              <select
                class="rprof-prov"
                :value="profile.provider"
                @change="
                  onUpdate(idx, 'provider', ($event.target as HTMLSelectElement).value)
                "
              >
                <option v-for="[val, label] in providerOptions" :key="val" :value="val">
                  {{ label }}
                </option>
              </select>
              <input
                type="password"
                class="rprof-key"
                :placeholder="t('remoteApi.optional')"
                autocomplete="off"
                :value="profile.api_key"
                @input="
                  onUpdate(idx, 'api_key', ($event.target as HTMLInputElement).value)
                "
              />
              <input
                type="text"
                class="rprof-url"
                :placeholder="t('remoteApi.baseUrlPlaceholder')"
                autocomplete="off"
                :value="profile.base_url"
                @input="
                  onUpdate(idx, 'base_url', ($event.target as HTMLInputElement).value)
                "
              />
              <span
                class="rprof-balance"
                :class="{ 'rprof-balance--loading': isBalanceLoading(idx) }"
                :title="t('remoteApi.limit')"
                >{{ balanceText(idx) }}</span
              >
              <button
                type="button"
                class="rprof-remove"
                :title="t('remoteApi.remove')"
                @click="onRemove(idx)"
              >
                ×
              </button>
            </div>
          </div>
          <div class="remote-profiles-actions">
            <button type="button" @click="onAdd">{{ t("remoteApi.add") }}</button>
            <button type="button" @click="onRefreshBalances">
              {{ t("remoteApi.refreshBalances") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { getRemoteProfileProviderOptions } from "@/features/remote-api/useRemoteApiProfiles";
import { useProviderBalances } from "@/features/remote-api/useProviderBalances";
import { useI18n } from "@/shared/lib/i18n";
import type { RemoteProfileRow } from "@/entities/project";

const { t } = useI18n();
const providerOptions = computed(() => getRemoteProfileProviderOptions());

const props = defineProps<{
  profiles: RemoteProfileRow[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof RemoteProfileRow, value: string];
}>();

const balances = useProviderBalances();

function onAdd(): void {
  emit("add");
}
function onRemove(idx: number): void {
  balances.forget(props.profiles[idx]);
  emit("remove", idx);
}
function onUpdate(idx: number, field: keyof RemoteProfileRow, value: string): void {
  emit("update", idx, field, value);
}

function onRefreshBalances(): void {
  void balances.refreshAll(props.profiles);
}

function isBalanceLoading(idx: number): boolean {
  return balances.entryFor(props.profiles[idx])?.loading ?? true;
}

// Never render or log `profile.api_key` here — this only maps a fetched
// status to display text. `status:"ok"` with a null `limit_remaining` is a
// legitimate OpenRouter response (the `/auth/key` endpoint can omit the
// field) and must render the same "usage-based" label as `"unknown"`,
// not the error placeholder.
function balanceText(idx: number): string {
  const entry = balances.entryFor(props.profiles[idx]);
  if (!entry || entry.loading) return t("remoteApi.balanceLoading");
  const balance = entry.balance;
  if (!balance || balance.status === "error") return t("remoteApi.balanceError");
  if (balance.status === "ok" && balance.limit_remaining != null) {
    return String(balance.limit_remaining);
  }
  return t("remoteApi.balanceUnknown");
}

onMounted(onRefreshBalances);
</script>
