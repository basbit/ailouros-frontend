<template>
  <p class="project-form__note">{{ t("projectForm.sections.movedNote") }}</p>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
</script>

<style scoped>
.project-form__note {
  margin: 12px 0 0;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--ink-3);
  background: var(--card);
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
}
</style>
