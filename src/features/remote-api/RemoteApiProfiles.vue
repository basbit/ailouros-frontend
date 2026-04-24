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
          </div>
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getRemoteProfileProviderOptions } from "@/features/remote-api/useRemoteApiProfiles";
import { useI18n } from "@/shared/lib/i18n";
import type { RemoteProfileRow } from "@/shared/store/projects";

const { t } = useI18n();
const providerOptions = computed(() => getRemoteProfileProviderOptions());

defineProps<{
  profiles: RemoteProfileRow[];
}>();

const emit = defineEmits<{
  add: [];
  remove: [idx: number];
  update: [idx: number, field: keyof RemoteProfileRow, value: string];
}>();

function onAdd(): void {
  emit("add");
}
function onRemove(idx: number): void {
  emit("remove", idx);
}
function onUpdate(idx: number, field: keyof RemoteProfileRow, value: string): void {
  emit("update", idx, field, value);
}
</script>
