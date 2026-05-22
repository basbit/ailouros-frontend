<template>
  <ol class="steps-tab">
    <li
      v-for="(step, index) in stepRows"
      :key="`${step.id}-${index}`"
      class="steps-tab__row"
      :class="`steps-tab__row--${step.state}`"
    >
      <span class="steps-tab__index">{{ index + 1 }}</span>
      <span class="steps-tab__id">{{ step.id }}</span>
      <span class="steps-tab__state">
        {{ t(`history.detail.stepState.${step.state}`) }}
      </span>
      <span class="steps-tab__meta">
        <span v-if="step.durationMs !== null">
          {{ formatDuration(step.durationMs) }}
        </span>
        <span>{{
          t("history.detail.stepMessages", { count: step.messageCount })
        }}</span>
      </span>
      <button
        v-if="canRollback && step.state !== 'pending'"
        type="button"
        class="steps-tab__rollback"
        :disabled="rollbackBusy"
        :title="t('history.detail.rollback.tooltip', { step: step.id })"
        @click="emit('rollback', step.id)"
      >
        <span aria-hidden="true">↶</span>
        <span>{{ t("history.detail.rollback.button") }}</span>
      </button>
    </li>
  </ol>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

interface StepRow {
  id: string;
  state: "completed" | "failed" | "skipped" | "pending";
  durationMs: number | null;
  messageCount: number;
}

defineProps<{
  stepRows: StepRow[];
  canRollback: boolean;
  rollbackBusy: boolean;
  formatDuration: (ms: number | null | undefined) => string;
}>();

const emit = defineEmits<{
  (event: "rollback", stepId: string): void;
}>();

const { t } = useI18n();
</script>

<style scoped>
.steps-tab {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.steps-tab__row {
  display: grid;
  grid-template-columns: 32px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.steps-tab__row--failed {
  border-color: color-mix(in srgb, var(--error) 35%, transparent);
}

.steps-tab__row--pending {
  opacity: 0.6;
}

.steps-tab__index {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  text-align: center;
}

.steps-tab__id {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--ink);
}

.steps-tab__state {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-3);
}

.steps-tab__row--failed .steps-tab__state {
  color: var(--error);
}

.steps-tab__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--ink-4);
}

.steps-tab__rollback {
  appearance: none;
  margin-left: auto;
  padding: 6px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
}

.steps-tab__rollback:hover:not(:disabled) {
  border-color: var(--warn, #c98a1a);
  color: var(--warn, #c98a1a);
}

.steps-tab__rollback:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
