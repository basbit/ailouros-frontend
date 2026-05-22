<template>
  <div
    v-if="open"
    class="scenario-picker-dialog__backdrop"
    role="presentation"
    @click.self="onCancel"
    @keydown.esc="onCancel"
  >
    <section
      class="scenario-picker-dialog__card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <header class="scenario-picker-dialog__head">
        <h2 :id="titleId" class="scenario-picker-dialog__title">
          {{ t("scenarios.pickerTitle") }}
        </h2>
        <div class="scenario-picker-dialog__actions">
          <button
            type="button"
            class="scenario-picker-dialog__settings"
            @click="onOpenSettings"
          >
            {{ t("scenarios.pickerOpenSettings") }}
          </button>
          <button
            type="button"
            class="scenario-picker-dialog__close"
            :aria-label="t('scenarios.pickerClose')"
            @click="onCancel"
          >
            &#10005;
          </button>
        </div>
      </header>
      <div class="scenario-picker-dialog__body">
        <ScenarioPicker
          :model-value="modelValue"
          :favorites="favorites"
          :custom-scenarios="customScenarios"
          :disabled="disabled"
          @update:model-value="onScenarioSelected"
          @toggle-favorite="onToggleFavorite"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import ScenarioPicker from "./ScenarioPicker.vue";
import { useI18n } from "@/shared/lib/i18n";
import type { CustomScenarioSnap } from "@/shared/model/project-types";

const props = withDefaults(
  defineProps<{
    open: boolean;
    modelValue: string | null;
    favorites?: string[];
    customScenarios?: CustomScenarioSnap[];
    disabled?: boolean;
  }>(),
  { favorites: () => [], customScenarios: () => [], disabled: false },
);

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:modelValue": [value: string | null];
  "toggle-favorite": [scenarioId: string];
  "open-settings": [];
}>();

function onOpenSettings(): void {
  emit("open-settings");
}

const { t } = useI18n();
const titleId = "scenario-picker-dialog-title";

function onCancel(): void {
  emit("update:open", false);
}

function onScenarioSelected(value: string | null): void {
  emit("update:modelValue", value);
  emit("update:open", false);
}

function onToggleFavorite(scenarioId: string): void {
  emit("toggle-favorite", scenarioId);
}

function handleKeydown(event: KeyboardEvent): void {
  if (!props.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    onCancel();
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.scenario-picker-dialog__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.scenario-picker-dialog__card {
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-lg, 12px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  width: min(960px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.scenario-picker-dialog__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--line);
}

.scenario-picker-dialog__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
}

.scenario-picker-dialog__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.scenario-picker-dialog__settings {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.scenario-picker-dialog__settings:hover {
  border-color: var(--line-strong);
  background: var(--surface);
}

.scenario-picker-dialog__close {
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 14px;
  cursor: pointer;
}

.scenario-picker-dialog__close:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.scenario-picker-dialog__body {
  overflow-y: auto;
  padding: 16px 24px;
  flex: 1 1 auto;
}
</style>
