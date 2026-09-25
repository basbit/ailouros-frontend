<template>
  <p class="setting-prerequisite" role="note" :data-test="`prerequisite-${field}`">
    <span>{{ message }}</span>
    <RouterLink :to="{ path: `/settings/${pane}`, query: { focus: field } }">
      {{ t("settingsField.prerequisite.open") }}
    </RouterLink>
  </p>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useI18n } from "@/shared/lib/i18n";

/** A setting this feature needs is off: say so and link straight to it. */
defineProps<{ message: string; pane: string; field: string }>();

const { t } = useI18n();
</script>

<style scoped>
.setting-prerequisite {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--c-warning-border, #f0c34a);
  background: var(--c-warning-bg, #fff4d6);
  color: var(--c-warning-text, #8a5a00);
  font-size: 13px;
}
</style>
