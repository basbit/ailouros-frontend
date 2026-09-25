<template>
  <p
    v-if="restartStatus.pending.length"
    class="restart-pending-banner"
    role="status"
    data-test="restart-pending-banner"
  >
    {{ t("settingsField.restart.pending", { names: restartStatus.pending.join(", ") }) }}
  </p>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import { restartStatus } from "@/shared/lib/global-search/restart-status";

const { t } = useI18n();
</script>

<style scoped>
.restart-pending-banner {
  margin: 0 0 12px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--c-warning-border, #f0c34a);
  background: var(--c-warning-bg, #fff4d6);
  color: var(--c-warning-text, #8a5a00);
  font-size: 13px;
}
</style>
