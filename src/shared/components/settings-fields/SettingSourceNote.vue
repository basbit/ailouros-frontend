<template>
  <span v-if="setInEnvironment || restartRequired" class="setting-source-note">
    <span
      v-if="setInEnvironment"
      class="setting-source-note__env"
      :data-test="`source-env-${field}`"
    >
      {{ isSecret ? t("settingsField.source.envSecret") : t("settingsField.source.env") }}
    </span>
    <span
      v-if="restartRequired"
      class="setting-source-note__restart"
      :title="t('settingsField.restart.hint')"
      :data-test="`restart-required-${field}`"
    >
      {{ t("settingsField.restart.badge") }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { isSecretSettingKey } from "@/shared/lib/global-search/secret-policy";
import { restartStatus } from "@/shared/lib/global-search/restart-status";
import type { StateKey } from "@/shared/lib/global-search/types";

const props = defineProps<{ field: StateKey }>();

const { t } = useI18n();
const { sourceOf } = useGlobalSearchKeys();

const setInEnvironment = computed(() => sourceOf(props.field) === "env");
const isSecret = computed(() => isSecretSettingKey(props.field));
const restartRequired = computed(() => restartStatus.requiredFields.includes(props.field));
</script>

<style scoped>
.setting-source-note {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-left: 6px;
}
.setting-source-note__env,
.setting-source-note__restart {
  padding: 0 6px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid currentColor;
}
.setting-source-note__env {
  color: var(--accent, #1e5fad);
}
.setting-source-note__restart {
  color: var(--c-warning-text, #8a5a00);
}
</style>
