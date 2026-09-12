<template>
  <div
    v-if="visible"
    class="budget-modal-overlay dialog-backdrop"
    @click.self="onClose"
  >
    <div
      ref="dialogRef"
      class="budget-modal dialog-card"
      role="dialog"
      aria-modal="true"
      :aria-label="t('budget.increaseTitle')"
      @keydown="onDialogKeydown"
    >
      <header class="budget-modal__header">
        <h3 class="budget-modal__title">{{ t("budget.increaseTitle") }}</h3>
        <button
          type="button"
          class="budget-modal__close"
          :aria-label="t('common.close')"
          @click="onClose"
        >
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
            class="budget-btn budget-btn--quick btn-secondary"
            :disabled="isSubmitting"
            @click="handleQuickAdd(1.0)"
          >
            +$1.00
          </button>
          <button
            type="button"
            class="budget-btn budget-btn--quick btn-secondary"
            :disabled="isSubmitting"
            @click="handleQuickAdd(5.0)"
          >
            +$5.00
          </button>
          <button
            type="button"
            class="budget-btn budget-btn--quick btn-secondary"
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

        <p v-if="submitError" class="budget-modal__error" role="alert">
          {{ submitError }}
        </p>
      </div>

      <footer class="budget-modal__footer">
        <button
          type="button"
          class="budget-btn budget-btn--ghost btn-ghost"
          @click="onClose"
        >
          {{ t("budget.cancel") }}
        </button>
        <button
          type="button"
          class="budget-btn budget-btn--primary btn-primary"
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
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
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
const { increaseBudget, lastError } = useTaskBudget();

const dialogRef = ref<HTMLDivElement | null>(null);
const customAmount = ref<number>(1.0);
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);
let focusOrigin: HTMLElement | null = null;

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return [];
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    ),
  );
}

function trapTab(event: KeyboardEvent): void {
  const focusable = focusableElements();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key === "Tab") trapTab(event);
}

// A keydown on a div only fires once something inside it has focus, so Escape
// also needs a window listener while the dialog is open.
function onWindowKeydown(event: KeyboardEvent): void {
  if (props.visible && event.key === "Escape") {
    event.preventDefault();
    onClose();
  }
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      focusOrigin = document.activeElement as HTMLElement | null;
      window.addEventListener("keydown", onWindowKeydown);
      void nextTick(() => {
        focusableElements()[0]?.focus();
      });
    } else {
      window.removeEventListener("keydown", onWindowKeydown);
      focusOrigin?.focus();
      focusOrigin = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKeydown);
});

function onClose(): void {
  submitError.value = null;
  emit("close");
}

async function applyIncrease(amount: number): Promise<void> {
  if (isSubmitting.value || amount <= 0 || !props.taskId) return;
  isSubmitting.value = true;
  submitError.value = null;
  const success = await increaseBudget(props.taskId, amount, 0);
  isSubmitting.value = false;
  if (success) {
    emit("increased");
    emit("close");
    return;
  }
  // Show what actually went wrong instead of a hardcoded English sentence.
  submitError.value = t("budget.increaseFailed", {
    error: lastError.value ?? t("budget.unknownError"),
  });
}

function handleQuickAdd(amount: number): void {
  void applyIncrease(amount);
}

function handleCustomAdd(): void {
  void applyIncrease(customAmount.value);
}
</script>

<style scoped>
/* Backdrop and card chrome come from the shared .dialog-backdrop / .dialog-card. */
.budget-modal-overlay {
  z-index: 9999;
}

.budget-modal {
  width: min(100%, 440px);
  display: flex;
  flex-direction: column;
}

.budget-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
}

.budget-modal__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.budget-modal__close {
  background: transparent;
  border: none;
  color: var(--ink-3);
  font-size: 16px;
  padding: 2px 6px;
  cursor: pointer;
}

.budget-modal__close:hover {
  color: var(--ink);
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
  background: color-mix(in srgb, var(--error) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--error) 35%, transparent);
  border-radius: var(--r-sm);
  color: var(--error);
  font-size: 13px;
}

.budget-modal__quick-actions {
  display: flex;
  gap: 10px;
}

.budget-btn {
  border-radius: var(--r-md);
}

.budget-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.budget-btn--quick {
  flex: 1;
  justify-content: center;
  font-weight: 600;
}

.budget-modal__custom {
  display: flex;
  flex-direction: column;
}

.budget-modal__label {
  font-size: 12px;
  color: var(--ink-3);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* .budget-modal__input inherits the global input[type="number"] styling. */

.budget-modal__error {
  color: var(--error);
  font-size: 12px;
  margin: 0;
}

.budget-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--line);
}
</style>
