<template>
  <aside class="role-preview">
    <header class="role-preview__head">
      <span class="role-preview__label">
        {{ t("rolePicker.previewLabel") }}
      </span>
      <div class="role-preview__meta">
        <span v-if="previewRoleId" class="role-preview__id">
          {{ previewRoleId }}
        </span>
        <button
          v-if="previewRoleId"
          type="button"
          class="role-preview__edit-btn"
          :title="t('rolePicker.editInModelsTitle')"
          @click="emit('edit', previewRoleId)"
        >
          {{ t("rolePicker.editInModels") }}
        </button>
      </div>
    </header>
    <div v-if="!previewRoleId" class="role-preview__empty">
      {{ t("rolePicker.previewHint") }}
    </div>
    <div v-else-if="promptLoading" class="role-preview__empty">
      {{ t("rolePicker.previewLoading") }}
    </div>
    <div v-else-if="promptError" class="role-preview__error">
      {{ promptError }}
    </div>
    <pre v-else class="role-preview__body">{{ promptBody }}</pre>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  previewRoleId: string;
  promptLoading: boolean;
  promptError: string;
  promptBody: string;
}>();

const emit = defineEmits<{
  edit: [roleId: string];
}>();

const { t } = useI18n();
</script>

<style scoped>
.role-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px 12px;
  gap: 6px;
}
.role-preview__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.role-preview__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2, #a8b0c4);
}
.role-preview__id {
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 11px;
  color: var(--text, #f5f0e7);
}
.role-preview__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.role-preview__edit-btn {
  appearance: none;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
  border-radius: 6px;
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.role-preview__edit-btn:hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 18%, transparent);
  border-color: var(--accent, #3b5bdb);
}
.role-preview__empty,
.role-preview__error {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.role-preview__error {
  color: var(--error, #c0392b);
}
.role-preview__body {
  flex: 1 1 auto;
  overflow: auto;
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: var(--surface2, #14171f);
  font-family: var(--mono, ui-monospace, monospace);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: var(--text, #f5f0e7);
}
</style>
