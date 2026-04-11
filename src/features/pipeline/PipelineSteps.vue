<template>
  <details class="section">
    <summary>Pipeline Steps</summary>
    <div class="section-body">
      <div id="pipeSteps" ref="stepsContainer">
        <div v-for="(step, idx) in steps" :key="step.uid" class="pipe-row">
          <span class="pipe-drag-handle" :title="t('pipelineSteps.dragToReorder')"
            >⠿</span
          >
          <select
            :value="step.id"
            @change="onStepChange(idx, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="[val, lbl] in options" :key="val" :value="val">
              {{ lbl }}
            </option>
            <!-- Preserve unknown values -->
            <option v-if="!options.find((o) => o[0] === step.id)" :value="step.id">
              {{ step.id }} (?)
            </option>
          </select>
          <button
            type="button"
            class="btn-icon"
            :title="t('pipelineSteps.remove')"
            @click="onRemove(idx)"
          >
            &#10005;
          </button>
        </div>
      </div>
      <div class="hint" style="margin-top: 4px">{{ t("pipelineSteps.hint") }}</div>
      <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap">
        <button type="button" class="btn-secondary" @click="emit('add')">
          {{ t("pipelineSteps.add") }}
        </button>
        <button type="button" class="btn-ghost" @click="emit('reset')">
          {{ t("pipelineSteps.reset") }}
        </button>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import Sortable from "sortablejs";
import type { PipeStep } from "@/features/pipeline/usePipeline";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  steps: PipeStep[];
  options: [string, string][];
}>();

const emit = defineEmits<{
  add: [];
  reset: [];
  remove: [idx: number];
  change: [idx: number, val: string];
  reorder: [oldIdx: number, newIdx: number];
}>();
const { t } = useI18n();

const stepsContainer = ref<HTMLElement | null>(null);
const sortableInstance = ref<Sortable | null>(null);

function initSortable(): void {
  if (!stepsContainer.value) return;
  if (sortableInstance.value) {
    try {
      sortableInstance.value.destroy();
    } catch {
      /* ignore */
    }
    sortableInstance.value = null;
  }
  sortableInstance.value = Sortable.create(stepsContainer.value, {
    animation: 200,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    handle: ".pipe-drag-handle",
    draggable: ".pipe-row",
    ghostClass: "pipe-sortable-ghost",
    chosenClass: "pipe-sortable-chosen",
    dragClass: "pipe-sortable-drag",
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    swapThreshold: 0.65,
    invertSwap: true,
    onEnd(evt) {
      const oldIdx = evt.oldIndex;
      const newIdx = evt.newIndex;
      if (oldIdx !== undefined && newIdx !== undefined && oldIdx !== newIdx) {
        emit("reorder", oldIdx, newIdx);
      }
    },
  });
}

onMounted(() => {
  initSortable();
});
onUnmounted(() => {
  if (sortableInstance.value) {
    try {
      sortableInstance.value.destroy();
    } catch {
      /* ignore */
    }
    sortableInstance.value = null;
  }
});

// Reinit sortable when steps change length
watch(
  () => props.steps.length,
  () => {
    // Give Vue a tick to render new DOM then reinit
    setTimeout(initSortable, 0);
  },
);

function onRemove(idx: number): void {
  emit("remove", idx);
}
function onStepChange(idx: number, val: string): void {
  emit("change", idx, val);
}
</script>
