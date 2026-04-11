<template>
  <div v-if="visible" class="human-gate" style="border-color: #c0392b">
    <div class="human-gate-title" style="color: #c0392b">
      &#9888; {{ t("retryGate.title") }}
      <span style="font-family: monospace">{{ failedStep }}</span>
    </div>
    <div style="margin-top: 6px; font-size: 12px; color: #aaa">
      {{ t("retryGate.hint") }}
    </div>
    <div style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap">
      <button
        type="button"
        class="btn-primary"
        style="background: #7a2a2a"
        @click="emit('retry', false)"
      >
        {{ t("retryGate.retryFailed") }}
      </button>
      <button
        type="button"
        class="btn-primary"
        style="background: #2a4a7a; font-size: 11px"
        @click="emit('retry', true)"
      >
        {{ t("retryGate.retryStart") }}
      </button>
      <button
        type="button"
        class="btn-primary"
        style="background: #2a6a3a; font-size: 11px"
        @click="toggleContinuePanel"
      >
        {{ t("retryGate.continueAdd") }}
      </button>
    </div>

    <!-- Continue pipeline panel -->
    <div
      v-if="showContinuePanel"
      style="margin-top: 12px; border-top: 1px solid #444; padding-top: 10px"
    >
      <div style="font-size: 12px; color: #ccc; margin-bottom: 8px">
        {{ t("retryGate.selectAdditional") }}
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px">
        <label
          v-for="step in availableSteps"
          :key="step"
          class="checkbox-row"
          style="font-size: 12px"
        >
          <input
            type="checkbox"
            :value="step"
            :checked="selectedSteps.includes(step)"
            @change="toggleStep(step)"
          />
          <span class="check-label" style="font-family: monospace">{{ step }}</span>
        </label>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 10px">
        <button
          type="button"
          class="btn-primary"
          style="background: #2a6a3a; font-size: 11px"
          :disabled="!selectedSteps.length"
          @click="onConfirmContinue"
        >
          {{ t("retryGate.confirmContinue") }}
        </button>
        <button
          type="button"
          class="btn-primary"
          style="background: #444; font-size: 11px"
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
  // Emit in canonical order
  const ordered = ALL_PIPELINE_STEPS.filter((s) => selectedSteps.value.includes(s));
  emit("continuePipeline", ordered);
  showContinuePanel.value = false;
  selectedSteps.value = [];
}
</script>
