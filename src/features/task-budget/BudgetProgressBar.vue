<template>
  <div class="budget-progress" :class="{ 'budget-progress--compact': compact }">
    <div v-if="!compact" class="budget-progress__labels">
      <span class="budget-progress__label-text">
        ${{ consumedUsd.toFixed(2) }} / ${{ budgetUsd.toFixed(2) }}
      </span>
      <span class="budget-progress__percentage"> {{ percentage.toFixed(0) }}% </span>
    </div>

    <div
      class="budget-progress-track"
      role="progressbar"
      :aria-valuenow="percentage"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="budget-progress-fill"
        :class="{
          'budget-progress-fill--warning': statusLevel === 'warning',
          'budget-progress-fill--exhausted': statusLevel === 'exhausted',
        }"
        :style="{ width: `${percentage}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    budgetUsd: number;
    consumedUsd: number;
    isWarning?: boolean;
    isExhausted?: boolean;
    compact?: boolean;
  }>(),
  {
    isWarning: false,
    isExhausted: false,
    compact: false,
  },
);

const percentage = computed(() => {
  if (props.budgetUsd <= 0) return 0;
  const ratio = (props.consumedUsd / props.budgetUsd) * 100;
  return Math.min(100, Math.max(0, ratio));
});

const statusLevel = computed<"normal" | "warning" | "exhausted">(() => {
  if (props.isExhausted || percentage.value >= 100) return "exhausted";
  if (props.isWarning || percentage.value >= 80) return "warning";
  return "normal";
});
</script>

<style scoped>
.budget-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.budget-progress__labels {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-family: var(--font-mono, monospace);
  color: var(--text-muted, #aaa);
}

.budget-progress__percentage {
  font-weight: 600;
}

.budget-progress-track {
  width: 100%;
  height: 6px;
  background: var(--bg-surface-elevated, #2a2a36);
  border-radius: 3px;
  overflow: hidden;
}

.budget-progress-fill {
  height: 100%;
  background: #10b981;
  border-radius: 3px;
  transition:
    width 0.3s ease,
    background 0.3s ease;
}

.budget-progress-fill--warning {
  background: #f59e0b;
}

.budget-progress-fill--exhausted {
  background: #ef4444;
  animation: pulse-fill 1.5s infinite;
}

@keyframes pulse-fill {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.budget-progress--compact .budget-progress-track {
  height: 3px;
}
</style>
