<template>
  <p v-if="syncError" class="settings-sync-error" role="alert" data-test="settings-sync-error">
    {{ t("settingsField.saveFailed", { reason: syncError }) }}
  </p>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";

const { t } = useI18n();
const { syncError } = useGlobalSearchKeys();
</script>

<style scoped>
.settings-sync-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--danger, #e5484d);
  border: 1px solid currentColor;
  font-size: 13px;
}
</style>
