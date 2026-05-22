<template>
  <div class="pm-hint" role="note">
    <span class="pm-hint__icon" aria-hidden="true">✦</span>
    <div class="pm-hint__body">
      <strong class="pm-hint__lead">{{ t("patternMemory.lead") }}:</strong>
      <span class="pm-hint__message">{{ message }}</span>
    </div>
    <button type="button" class="pm-hint__apply" @click="emit('apply')">
      {{ t("patternMemory.apply") }}
    </button>
    <button
      type="button"
      class="pm-hint__dismiss"
      :aria-label="t('patternMemory.dismiss')"
      @click="emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  message: string;
}>();

const emit = defineEmits<{
  apply: [];
  dismiss: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.pm-hint {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--accent-soft);
  border-radius: var(--r-md);
  font-size: 12px;
  color: var(--ink-2);
}

.pm-hint__icon {
  color: var(--accent-2);
  font-size: 14px;
  line-height: 1.4;
}

.pm-hint__body {
  flex: 1;
  line-height: 1.55;
}

.pm-hint__lead {
  color: var(--accent-2);
  margin-right: 4px;
}

.pm-hint__apply {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--ink);
  cursor: pointer;
  transition: background 0.14s;
}

.pm-hint__apply:hover {
  background: color-mix(in srgb, var(--ink) 6%, transparent);
}

.pm-hint__dismiss {
  appearance: none;
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: var(--ink-4);
  cursor: pointer;
  padding: 0 4px;
}

.pm-hint__dismiss:hover {
  color: var(--ink-2);
}
</style>
