<template>
  <div v-if="visible" class="budget-modal-overlay" @keydown.esc="onClose">
    <div class="budget-modal" role="dialog" aria-modal="true">
      <header class="budget-modal__header">
        <h3 class="budget-modal__title">{{ t("budget.increaseTitle") }}</h3>
        <button type="button" class="budget-modal__close" @click="onClose">
          &#10005;
        </button>
      </header>

      <div class="budget-modal__body">
        <BudgetProgressBar
          v-if="(budgetUsd ?? 0) > 0 || (consumedUsd ?? 0) > 0"
          :budget-usd="budgetUsd ?? 0"
          :consumed-usd="consumedUsd ?? 0"
          :is-warning="isWarning"
          :is-exhausted="isExhausted"
        />

        <p v-if="isExhausted" class="budget-modal__warning">
          {{ t("budget.exhaustedAlert") }}
        </p>

        <div class="budget-modal__quick-actions">
          <button
            type="button"
            class="budget-btn budget-btn--quick"
            :disabled="isSubmitting"
            @click="handleQuickAdd(1.0)"
          >
            +$1.00
          </button>
          <button
            type="button"
            class="budget-btn budget-btn--quick"
            :disabled="isSubmitting"
            @click="handleQuickAdd(5.0)"
          >
            +$5.00
          </button>
          <button
            type="button"
            class="budget-btn budget-btn--quick"
            :disabled="isSubmitting"
            @click="handleQuickAdd(10.0)"
          >
            +$10.00
          </button>
        </div>

        <div class="budget-modal__custom">
          <label class="budget-modal__label">
            {{ t("budget.customAmount") }} ($ USD)
            <input
              v-model.number="customAmount"
              type="number"
              min="0.1"
              step="0.5"
              class="budget-modal__input"
              placeholder="1.00"
            />
          </label>
        </div>

        <p v-if="submitError" class="budget-modal__error">
          {{ submitError }}
        </p>
      </div>

      <footer class="budget-modal__footer">
        <button type="button" class="budget-btn budget-btn--ghost" @click="onClose">
          {{ t("budget.cancel") }}
        </button>
        <button
          type="button"
          class="budget-btn budget-btn--primary"
          :disabled="isSubmitting || customAmount <= 0"
          @click="handleCustomAdd"
        >
          {{ isSubmitting ? "..." : t("budget.addAmount") }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useTaskBudget } from "./useTaskBudget";
import BudgetProgressBar from "./BudgetProgressBar.vue";

const props = defineProps<{
  visible: boolean;
  taskId: string;
  isExhausted?: boolean;
  budgetUsd?: number;
  consumedUsd?: number;
  isWarning?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  increased: [];
}>();

const { t } = useI18n();
const { increaseBudget } = useTaskBudget();

const customAmount = ref<number>(1.0);
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);

function onClose(): void {
  submitError.value = null;
  emit("close");
}

async function handleQuickAdd(amount: number): Promise<void> {
  if (isSubmitting.value || !props.taskId) return;
  isSubmitting.value = true;
  submitError.value = null;
  const success = await increaseBudget(props.taskId, amount, 0);
  isSubmitting.value = false;
  if (success) {
    emit("increased");
    emit("close");
  } else {
    submitError.value = "Failed to update budget";
  }
}

async function handleCustomAdd(): Promise<void> {
  if (isSubmitting.value || customAmount.value <= 0 || !props.taskId) return;
  isSubmitting.value = true;
  submitError.value = null;
  const success = await increaseBudget(props.taskId, customAmount.value, 0);
  isSubmitting.value = false;
  if (success) {
    emit("increased");
    emit("close");
  } else {
    submitError.value = "Failed to update budget";
  }
}
</script>

<style scoped>
.budget-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.budget-modal {
  background: var(--bg-surface, #1e1e24);
  border: 1px solid var(--border-color, #2e2e38);
  border-radius: 8px;
  width: 90%;
  max-width: 440px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
}

.budget-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color, #2e2e38);
}

.budget-modal__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.budget-modal__close {
  background: transparent;
  border: none;
  color: var(--text-muted, #888);
  font-size: 16px;
  cursor: pointer;
}

.budget-modal__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.budget-modal__warning {
  margin: 0;
  padding: 8px 12px;
  background: rgba(220, 53, 69, 0.15);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 6px;
  color: #ff6b6b;
  font-size: 13px;
}

.budget-modal__quick-actions {
  display: flex;
  gap: 10px;
}

.budget-btn {
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #333);
  background: var(--bg-elevated, #2a2a34);
  color: var(--text-normal, #eee);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.budget-btn:hover:not(:disabled) {
  background: var(--bg-hover, #363644);
}

.budget-btn--quick {
  flex: 1;
  font-weight: 600;
}

.budget-btn--primary {
  background: var(--accent-primary, #3b82f6);
  border-color: var(--accent-primary, #3b82f6);
  color: #fff;
}

.budget-btn--ghost {
  background: transparent;
  border-color: transparent;
}

.budget-modal__custom {
  display: flex;
  flex-direction: column;
}

.budget-modal__label {
  font-size: 12px;
  color: var(--text-muted, #aaa);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.budget-modal__input {
  padding: 8px 12px;
  background: var(--bg-input, #16161c);
  border: 1px solid var(--border-color, #333);
  border-radius: 6px;
  color: var(--text-normal, #eee);
  font-size: 14px;
}

.budget-modal__error {
  color: #ff6b6b;
  font-size: 12px;
  margin: 0;
}

.budget-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--border-color, #2e2e38);
}
</style>
