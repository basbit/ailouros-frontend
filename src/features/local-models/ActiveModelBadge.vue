<template>
  <button
    type="button"
    class="active-model-badge"
    :class="`active-model-badge--${state.view.value.kind}`"
    :title="t('activeModel.openSettings')"
    @click="emit('click')"
  >
    <span class="active-model-badge__dot" aria-hidden="true" />
    <span class="active-model-badge__label">{{ kindLabel }}</span>
    <span v-if="state.view.value.label" class="active-model-badge__model">{{
      state.view.value.label
    }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useActiveModel } from "./useActiveModel";

const emit = defineEmits<{ click: [] }>();
const { t } = useI18n();
const state = useActiveModel();

const kindLabel = computed(() => {
  switch (state.view.value.kind) {
    case "local":
      return t("activeModel.local");
    case "cloud":
      return t("activeModel.cloud");
    default:
      return t("activeModel.none");
  }
});
</script>

<style scoped>
.active-model-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, #d4d4d8);
  background: transparent;
  cursor: pointer;
  font-size: 0.78rem;
  color: var(--text, #111);
}
.active-model-badge:hover {
  background: var(--surface-hover, rgba(0, 0, 0, 0.05));
}
.active-model-badge__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: var(--text-muted, #94a3b8);
}
.active-model-badge--local .active-model-badge__dot {
  background: #16a34a;
}
.active-model-badge--cloud .active-model-badge__dot {
  background: #2563eb;
}
.active-model-badge--none .active-model-badge__dot {
  background: #f59e0b;
}
.active-model-badge__label {
  font-weight: 600;
}
.active-model-badge__model {
  color: var(--text-muted, #555);
  max-width: 14ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
