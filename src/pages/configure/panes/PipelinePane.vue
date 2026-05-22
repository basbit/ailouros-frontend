<template>
  <section class="pipeline-pane">
    <PaneHeader
      :title="t('configure.pipeline.title')"
      :subtitle="t('configure.pipeline.subtitle')"
    >
      <template #actions>
        <button type="button" class="pipeline-pane__reset" @click="onResetToTopology">
          {{ t("configure.pipeline.resetToTopology") }}
        </button>
      </template>
    </PaneHeader>

    <div class="pipeline-pane__topology">
      <span class="pipeline-pane__field-label">
        {{ t("configure.pipeline.topologyLabel") }}
      </span>
      <div class="pipeline-pane__topology-buttons" role="radiogroup">
        <button
          v-for="option in topologyOptions"
          :key="option.id"
          type="button"
          role="radio"
          :aria-checked="topologyValue === option.id"
          class="pipeline-pane__topology-btn"
          :class="{
            'pipeline-pane__topology-btn--active': topologyValue === option.id,
          }"
          @click="onTopologyChange(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <PipelineStepEditor
      :model-value="steps"
      :step-options="stepOptions"
      :label="t('configure.pipeline.stepsLabel')"
      :add-label="t('configure.pipeline.addStep')"
      :up-label="t('configure.pipeline.moveStepUp')"
      :down-label="t('configure.pipeline.moveStepDown')"
      :remove-label="t('configure.pipeline.removeStep')"
      @add="onAddStep"
      @remove="onRemove"
      @move="onMove"
      @update="onStepKindChange"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import PipelineStepEditor from "@/features/pipeline/PipelineStepEditor.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import {
  TOPOLOGY_PRESETS,
  recommendedStepsForTopology,
  deriveStagesForTopology,
  type TopologyId,
} from "@/features/pipeline/topologyPresets";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

const TOPOLOGY_IDS: readonly TopologyId[] = ["linear", "parallel", "ring", "mesh"];

const topologyOptions = computed(() =>
  TOPOLOGY_IDS.map((id) => ({ id, label: TOPOLOGY_PRESETS[id].label })),
);

const steps = computed(() => settings.pipelineState.steps.value);
const stepOptions = computed(() => settings.pipelineState.getOptions());

const topologyValue = computed<TopologyId>(() => {
  const raw = (settings.form.swarm_topology ?? "").trim();
  return (TOPOLOGY_IDS as string[]).includes(raw) ? (raw as TopologyId) : "linear";
});

function onTopologyChange(id: TopologyId): void {
  settings.form.swarm_topology = id;
  settings.saveSettingsSoon();
}

function onResetToTopology(): void {
  const ids = recommendedStepsForTopology(topologyValue.value);
  settings.pipelineState.applyStepIds(ids);
  const stages = deriveStagesForTopology(ids, topologyValue.value);
  settings.pipelineState.applyStagesSnap(stages);
}

function onMove(index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= steps.value.length) return;
  settings.pipelineState.reorder(index, target);
}

function onRemove(index: number): void {
  settings.pipelineState.removeStep(index);
}

function onAddStep(): void {
  settings.pipelineState.addStep();
}

function onStepKindChange(index: number, nextId: string): void {
  settings.pipelineState.updateStep(index, nextId);
}
</script>

<style scoped>
.pipeline-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 760px;
}

.pipeline-pane__reset {
  appearance: none;
  background: transparent;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 6px 12px;
  font-size: 12px;
  color: var(--ink-2);
  cursor: pointer;
}

.pipeline-pane__reset:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.pipeline-pane__field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
  margin-bottom: 8px;
}

.pipeline-pane__topology-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pipeline-pane__topology-btn {
  appearance: none;
  padding: 6px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
    border-color 0.14s,
    background 0.14s;
}

.pipeline-pane__topology-btn:hover {
  border-color: var(--line-strong);
}

.pipeline-pane__topology-btn--active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}
</style>
