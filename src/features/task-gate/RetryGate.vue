<template>
  <div v-if="visible" class="human-gate retry-gate retry-gate--danger">
    <div class="human-gate-title retry-gate__title">
      &#9888; {{ t("retryGate.title") }}
      <code class="retry-gate__failed-step">{{ failedStep }}</code>
    </div>
    <div class="retry-gate__hint">
      {{ t("retryGate.hint") }}
    </div>
    <div class="retry-gate__actions">
      <button
        type="button"
        class="btn-primary btn-primary--danger"
        @click="emit('retry', false)"
      >
        {{ t("retryGate.retryFailed") }}
      </button>
      <button
        type="button"
        class="btn-primary retry-gate__secondary-btn"
        @click="emit('retry', true)"
      >
        {{ t("retryGate.retryStart") }}
      </button>
      <button
        type="button"
        class="btn-primary btn-primary--success retry-gate__secondary-btn"
        @click="toggleContinuePanel"
      >
        {{ t("retryGate.continueAdd") }}
      </button>
    </div>

    <!-- Continue pipeline panel -->
    <div v-if="showContinuePanel" class="retry-gate__continue-panel">
      <div class="retry-gate__continue-hint">
        {{ t("retryGate.selectAdditional") }}
      </div>
      <div class="retry-gate__step-list">
        <label
          v-for="step in availableSteps"
          :key="step"
          class="checkbox-row retry-gate__step-row"
        >
          <input
            type="checkbox"
            :value="step"
            :checked="selectedSteps.includes(step)"
            @change="toggleStep(step)"
          />
          <span class="check-label retry-gate__step-name">{{ step }}</span>
        </label>
      </div>
      <div class="retry-gate__continue-actions">
        <button
          type="button"
          class="btn-primary btn-primary--success retry-gate__secondary-btn"
          :disabled="!selectedSteps.length"
          @click="onConfirmContinue"
        >
          {{ t("retryGate.confirmContinue") }}
        </button>
        <button
          type="button"
          class="btn-secondary retry-gate__secondary-btn"
          @click="showContinuePanel = false"
        >
          {{ t("dialogs.cancel") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ALL_PIPELINE_STEPS } from "./useTaskGates";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  visible: boolean;
  failedStep: string;
  currentPipelineSteps?: string[];
}>();

const emit = defineEmits<{
  retry: [fromBeginning: boolean];
  continuePipeline: [additionalSteps: string[]];
}>();
const { t } = useI18n();

const showContinuePanel = ref(false);
const selectedSteps = ref<string[]>([]);

const availableSteps = computed(() => {
  const current = new Set(props.currentPipelineSteps ?? []);
  return ALL_PIPELINE_STEPS.filter((s) => !current.has(s));
});

function toggleContinuePanel(): void {
  showContinuePanel.value = !showContinuePanel.value;
  selectedSteps.value = [];
}

function toggleStep(step: string): void {
  const idx = selectedSteps.value.indexOf(step);
  if (idx >= 0) {
    selectedSteps.value.splice(idx, 1);
  } else {
    selectedSteps.value.push(step);
  }
}

function onConfirmContinue(): void {
  if (!selectedSteps.value.length) return;
  const ordered = ALL_PIPELINE_STEPS.filter((s) => selectedSteps.value.includes(s));
  emit("continuePipeline", ordered);
  showContinuePanel.value = false;
  selectedSteps.value = [];
}
</script>

<style scoped>
.retry-gate--danger {
  border-color: var(--error);
}
.retry-gate__title {
  color: var(--error);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.retry-gate__failed-step {
  font-family: var(--mono);
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--error) 12%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--error) 30%, transparent);
  color: var(--error);
}
.retry-gate__hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text2);
}
.retry-gate__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.retry-gate__secondary-btn {
  font-size: 11px;
}
.retry-gate__continue-panel {
  margin-top: 12px;
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
.retry-gate__continue-hint {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 8px;
}
.retry-gate__step-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.retry-gate__step-row {
  font-size: 12px;
}
.retry-gate__step-name {
  font-family: var(--mono);
}
.retry-gate__continue-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>
