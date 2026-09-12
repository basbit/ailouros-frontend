<template>
  <button
    type="button"
    class="step-fork-btn btn-icon"
    :class="{ 'step-fork-btn--forking': busy }"
    :disabled="busy"
    :title="t('stepFork.button')"
    :aria-label="t('stepFork.button')"
    @click.stop="emit('fork')"
  >
    <span class="step-fork-btn__icon">🔀</span>
    <span class="step-fork-btn__label">
      {{ busy ? t("stepFork.forking") : t("stepFork.button") }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

withDefaults(defineProps<{ busy?: boolean }>(), { busy: false });

const emit = defineEmits<{ (event: "fork"): void }>();

const { t } = useI18n();
</script>

<style scoped>
/* Base look comes from the shared .btn-icon class in app.css. */
.step-fork-btn {
  gap: 4px;
}

.step-fork-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-fork-btn--forking {
  opacity: 0.8;
}

.step-fork-btn__icon {
  font-size: 11px;
}
</style>
