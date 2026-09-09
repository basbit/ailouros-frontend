<template>
  <div v-if="hasBudget" class="task-budget-badge-container">
    <button
      type="button"
      class="task-budget-badge"
      :class="{
        'task-budget-badge--warning': budget?.is_warning && !budget?.is_exhausted,
        'task-budget-badge--exhausted': budget?.is_exhausted,
      }"
      :title="'Task Budget: click to increase limit'"
      @click="isModalOpen = true"
    >
      <span class="task-budget-badge__icon">&#128176;</span>
      <span class="task-budget-badge__text">{{ displayCost }}</span>
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
import { useTaskBudget } from "./useTaskBudget";
import IncreaseBudgetModal from "./IncreaseBudgetModal.vue";

const props = defineProps<{
  taskId: string | null;
  isRunning?: boolean;
}>();

const { budget, refresh } = useTaskBudget();
const isModalOpen = ref(false);
let pollTimer: ReturnType<typeof setInterval> | null = null;

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
        }, 5000);
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
.task-budget-badge-container {
  display: inline-flex;
  align-items: center;
}

.task-budget-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: var(--bg-surface-elevated, #24242e);
  border: 1px solid var(--border-color, #383848);
  border-radius: 12px;
  color: var(--text-muted, #aaa);
  font-size: 12px;
  font-family: monospace;
  cursor: pointer;
  transition: all 0.2s;
}

.task-budget-badge:hover {
  background: var(--bg-surface-hover, #2c2c3a);
  border-color: var(--accent-primary, #3b82f6);
  color: var(--text-normal, #eee);
}

.task-budget-badge--warning {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.task-budget-badge--exhausted {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.15);
  animation: pulse-border 1.5s infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
}

.task-budget-badge__icon {
  font-size: 11px;
}

.task-budget-badge__text {
  font-weight: 500;
}
</style>
