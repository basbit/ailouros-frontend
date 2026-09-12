<template>
  <div v-if="hasBudget" class="task-budget-badge-container">
    <button
      type="button"
      class="task-budget-badge task-pill"
      :class="{
        'task-budget-badge--warning': budget?.is_warning && !budget?.is_exhausted,
        'task-budget-badge--exhausted': budget?.is_exhausted,
        'task-budget-badge--stale': isStale,
      }"
      :title="badgeTitle"
      @click="isModalOpen = true"
    >
      <span class="task-budget-badge__icon">&#128176;</span>
      <span class="task-budget-badge__text">{{ displayCost }}</span>
      <span v-if="isStale" class="task-budget-badge__stale-mark">&#9888;</span>
    </button>

    <IncreaseBudgetModal
      :visible="isModalOpen"
      :task-id="taskId ?? ''"
      :is-exhausted="budget?.is_exhausted"
      :budget-usd="budget?.budget_usd ?? 0"
      :consumed-usd="budget?.consumed_usd ?? 0"
      :is-warning="budget?.is_warning"
      @close="isModalOpen = false"
      @increased="onBudgetIncreased"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useTaskBudget } from "./useTaskBudget";
import IncreaseBudgetModal from "./IncreaseBudgetModal.vue";

const POLL_INTERVAL_MS = 5000;

const props = defineProps<{
  taskId: string | null;
  isRunning?: boolean;
}>();

const { t } = useI18n();
const { budget, lastError, refresh } = useTaskBudget();
const isModalOpen = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

// The badge keeps polling every 5s. Without this it would keep showing the last
// good cost after the endpoint started failing, with no sign it is stale.
const isStale = computed(() => Boolean(lastError.value));

const badgeTitle = computed(() =>
  isStale.value
    ? t("budget.staleTitle", { error: lastError.value ?? "" })
    : t("budget.badgeTitle"),
);

const hasBudget = computed(() => {
  return Boolean(
    props.taskId &&
    budget.value &&
    (budget.value.budget_usd > 0 || budget.value.consumed_usd > 0),
  );
});

const displayCost = computed(() => {
  if (!budget.value) return "";
  const consumed = budget.value.consumed_usd.toFixed(2);
  if (budget.value.budget_usd <= 0) {
    return `$${consumed}`;
  }
  const limit = budget.value.budget_usd.toFixed(2);
  return `$${consumed} / $${limit}`;
});

function onBudgetIncreased(): void {
  if (props.taskId) {
    refresh(props.taskId);
  }
}

watch(
  () => props.taskId,
  (newTaskId) => {
    if (newTaskId) {
      refresh(newTaskId);
    }
  },
  { immediate: true },
);

watch(
  () => props.isRunning,
  (running) => {
    if (running && props.taskId) {
      if (!pollTimer) {
        pollTimer = setInterval(() => {
          if (props.taskId) refresh(props.taskId);
        }, POLL_INTERVAL_MS);
      }
    } else if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.taskId) {
    refresh(props.taskId);
  }
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<style scoped>
/* The figure is the last one the backend confirmed; the poll is failing.
   Dimmed and dashed so a stale number cannot read as a live one. */
.task-budget-badge--stale {
  opacity: 0.65;
  border-style: dashed;
}

.task-budget-badge-container {
  display: inline-flex;
  align-items: center;
}

/* Pill shape, border, mono font and radius come from the shared .task-pill. */
.task-budget-badge {
  gap: 5px;
  padding: 3px 10px;
  font-size: 12px;
  color: var(--ink-3);
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    color 0.2s;
}

.task-budget-badge:hover {
  background: var(--card-soft);
  border-color: var(--accent);
  color: var(--ink);
}

.task-budget-badge--warning {
  border-color: var(--warn);
  color: var(--warn);
  background: color-mix(in srgb, var(--warn) 12%, transparent);
}

.task-budget-badge--exhausted {
  border-color: var(--error);
  color: var(--error);
  background: color-mix(in srgb, var(--error) 15%, transparent);
  animation: pulse-border 1.5s infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--error) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px transparent;
  }
}

.task-budget-badge__icon {
  font-size: 11px;
}

.task-budget-badge__text {
  font-weight: 500;
}
</style>
