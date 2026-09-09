<template>
  <button
    type="button"
    class="step-fork-btn"
    :class="{ 'step-fork-btn--forking': isForking }"
    :disabled="isForking"
    :title="t('stepFork.button')"
    :aria-label="t('stepFork.button')"
    @click.stop="handleFork"
  >
    <span class="step-fork-btn__icon">🔀</span>
    <span class="step-fork-btn__label">
      {{ isForking ? t("stepFork.forking") : t("stepFork.button") }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { forkTaskStep } from "@/entities/task/api/task-fork-api";

const props = defineProps<{
  taskId: string;
  stepId: string;
}>();

const emit = defineEmits<{
  (event: "forked", forkedTaskId: string): void;
}>();

const { t } = useI18n();
const isForking = ref(false);

async function handleFork(): Promise<void> {
  if (isForking.value) return;
  isForking.value = true;
  try {
    const result = await forkTaskStep(props.taskId, {
      step_id: props.stepId,
    });
    emit("forked", result.forked_task_id);
  } catch {
    // Graceful error state handling
  } finally {
    isForking.value = false;
  }
}
</script>

<style scoped>
.step-fork-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #ffffff);
  color: var(--text-primary, #1e293b);
  transition: all 0.15s ease;
}

.step-fork-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f1f5f9);
  border-color: #94a3b8;
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
