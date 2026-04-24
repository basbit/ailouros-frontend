<template>
  <details class="panel pipeline-graph-panel" :open="open">
    <summary class="panel-header" @click.prevent="open = !open">
      <span class="panel-title">{{ t("graph.title") }}</span>
      <PipelineSummary v-if="steps.length" :steps="steps" />
      <span
        v-if="taskStatus"
        class="pg-status-badge"
        :class="`pg-status-badge--${taskStatus}`"
        >{{ taskStatus }}</span
      >
    </summary>
    <div class="panel-body">
      <PipelineGraphTopologySelector
        :active-topology="topo"
        :show-heavy-hint="!!editorSteps && steps.length > recommendedCount * 2"
        :layout-label="t('graph.layout')"
        :layout-help="t('graph.layoutHelp')"
        :heavy-hint="
          t('graph.pipelineHeavyHint', {
            n: steps.length,
            recommended: recommendedCount,
          })
        "
        :reset-recommended-label="t('graph.resetRecommended')"
        :reset-recommended-title="t('graph.resetRecommendedTitle')"
        @update:topology="(value) => $emit('update:topology', value)"
        @reset-recommended="$emit('editor:reset-recommended')"
      />

      <template v-if="steps.length">
        <!-- LINEAR -->
        <div
          v-if="topo === 'linear'"
          ref="sortableContainer"
          class="step-flow step-flow--linear"
        >
          <StepCard
            v-for="step in stepRefs"
            :key="stepKey(step)"
            :step-id="step.id"
            :status="stepStatus(step.id)"
            :editable="!!editorSteps"
            :options="editorOptions"
            @remove="$emit('editor:remove', step.index)"
            @change="(v) => $emit('editor:change', step.index, v)"
          />
        </div>

        <!-- PARALLEL -->
        <div
          v-else-if="topo === 'parallel'"
          ref="sortableContainer"
          class="step-flow step-flow--parallel"
        >
          <div v-for="(stage, si) in parallelStages" :key="si" class="step-stage">
            <StepCard
              v-for="step in stage"
              :key="stepKey(step)"
              :step-id="step.id"
              :status="stepStatus(step.id)"
              :parallel="stage.length > 1"
              :editable="!!editorSteps"
              :options="editorOptions"
              @remove="$emit('editor:remove', step.index)"
              @change="(v) => $emit('editor:change', step.index, v)"
            />
          </div>
        </div>

        <!-- RING -->
        <div
          v-else-if="topo === 'ring'"
          ref="sortableContainer"
          class="step-flow step-flow--ring"
          style="position: relative"
        >
          <PipelineGraphEdges
            :lines="topoLines"
            :width="svgWidth"
            :height="svgHeight"
            variant="ring"
          />
          <StepCard
            v-for="step in stepRefs"
            :key="stepKey(step)"
            :step-id="step.id"
            :status="stepStatus(step.id)"
            :editable="!!editorSteps"
            :options="editorOptions"
            @remove="$emit('editor:remove', step.index)"
            @change="(v) => $emit('editor:change', step.index, v)"
          />
        </div>

        <!-- MESH -->
        <div
          v-else-if="topo === 'mesh'"
          ref="sortableContainer"
          class="step-flow step-flow--mesh"
          style="position: relative"
        >
          <PipelineGraphEdges
            :lines="topoLines"
            :width="svgWidth"
            :height="svgHeight"
            variant="mesh"
          />
          <StepCard
            v-for="step in stepRefs"
            :key="stepKey(step)"
            :step-id="step.id"
            :status="stepStatus(step.id)"
            :editable="!!editorSteps"
            :options="editorOptions"
            @remove="$emit('editor:remove', step.index)"
            @change="(v) => $emit('editor:change', step.index, v)"
          />
        </div>
      </template>
      <div v-else class="pg-empty hint">{{ t("graph.empty") }}</div>

      <div v-if="editorSteps" class="pg-editor-actions">
        <button class="btn-secondary" @click="$emit('editor:add')">
          + {{ t("graph.add") }}
        </button>
        <button class="btn-ghost" @click="$emit('editor:reset')">
          {{ t("graph.reset") }}
        </button>
      </div>

      <PipelineGraphLegend />

      <div class="pg-host-metrics">
        <HostMetrics :metrics="hostMetrics ?? null" />
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import HostMetrics from "@/shared/components/HostMetrics.vue";
import StepCard from "@/widgets/pipeline-graph/StepCard.vue";
import PipelineSummary from "@/widgets/pipeline-graph/PipelineSummary.vue";
import PipelineGraphLegend from "@/widgets/pipeline-graph/PipelineGraphLegend.vue";
import PipelineGraphTopologySelector from "@/widgets/pipeline-graph/PipelineGraphTopologySelector.vue";
import PipelineGraphEdges from "@/widgets/pipeline-graph/PipelineGraphEdges.vue";
import { useTopologyConnections } from "@/widgets/pipeline-graph/useTopologyConnections";
import { usePipelineGraphInteractions } from "@/widgets/pipeline-graph/usePipelineGraphInteractions";
import { recommendedStepsForTopology } from "@/shared/lib/pipeline-topology";
import {
  usePipelineGraphLayout,
  type GraphStepRef,
} from "@/widgets/pipeline-graph/usePipelineGraphLayout";
import type { PipeStep } from "@/shared/model/pipeline-types";
import type { HostMetrics as HostMetricsType } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  steps: string[];
  topology?: string;
  activeStep?: string | null;
  completedSteps?: string[];
  failedStep?: string;
  skippedSteps?: string[];
  retryingSteps?: string[];
  blockedStep?: string | null;
  taskStatus?: string | null;
  hostMetrics?: HostMetricsType | null;
  editorSteps?: PipeStep[];
  editorOptions?: [string, string][];
}>();
const { t } = useI18n();

const emit = defineEmits<{
  "update:topology": [value: string];
  "editor:add": [];
  "editor:reset": [];
  "editor:reset-recommended": [];
  "editor:remove": [idx: number];
  "editor:change": [idx: number, val: string];
  "editor:reorder": [oldIdx: number, newIdx: number, count?: number];
  "editor:group": [idxA: number, idxB: number];
  "editor:ungroup": [idx: number];
}>();

const open = ref(true);
const sortableContainer = ref<HTMLElement | null>(null);

const topo = computed(() => {
  const value = (props.topology ?? "").trim();
  return ["parallel", "ring", "mesh"].includes(value) ? value : "linear";
});

const recommendedCount = computed(() => recommendedStepsForTopology(topo.value).length);

// When editorSteps is provided the SortableJS container must render from those
// ids so that oldIndex/newIndex in onEnd always match the configured array —
// not the historical run steps that effectivePipelineSteps may carry.
const editorStepIds = computed<string[]>(() =>
  props.editorSteps?.length ? props.editorSteps.map((s) => s.id) : [],
);

const { stepRefs, parallelStages, stepStatus } = usePipelineGraphLayout(
  props,
  editorStepIds,
);

function stepKey(step: GraphStepRef): string {
  return props.editorSteps?.[step.index]?.uid ?? `${step.id}:${step.index}`;
}

const editorEnabled = computed(() => !!props.editorSteps);
const stepSignal = computed(() =>
  (editorStepIds.value.length ? editorStepIds.value : props.steps).join("\u0000"),
);

usePipelineGraphInteractions({
  container: sortableContainer,
  topology: topo,
  parallelStages,
  editorEnabled,
  stepSignal,
  onReorder: (oldIdx, newIdx, count) => emit("editor:reorder", oldIdx, newIdx, count),
});

const stepCountRef = computed(() => props.steps.length);
const {
  lines: topoLines,
  svgWidth,
  svgHeight,
} = useTopologyConnections(sortableContainer, topo, stepCountRef);
</script>

<style scoped>
/* LINEAR */
.step-flow--linear {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding: 4px 0 8px;
}
.step-flow--linear :deep(.step-card:not(:last-child))::after {
  content: "\2192"; /* → */
  position: absolute;
  right: -16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3, #666);
  font-size: 14px;
  pointer-events: none;
}

/* PARALLEL */
.step-flow--parallel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
  padding: 4px 0 8px;
}
.step-stage {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  position: relative;
}
.step-stage:not(:last-child)::after {
  content: "\2192";
  position: absolute;
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3, #666);
  font-size: 14px;
  pointer-events: none;
}

/* RING */
.step-flow--ring {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding: 8px;
  border: 1px dashed rgba(77, 171, 247, 0.3);
  border-radius: 12px;
  position: relative;
}
.step-flow--ring :deep(.step-card:not(:last-child))::after {
  content: "\2192";
  position: absolute;
  right: -16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text3, #666);
  font-size: 14px;
  pointer-events: none;
}

/* MESH */
.step-flow--mesh {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 10px;
  justify-content: start;
  padding: 4px 0 8px;
}

/* SortableJS drag feedback — classes are applied to StepCard root at
   drag time, so they live here (alongside the flow containers) rather
   than inside StepCard.vue. */
:deep(.step-sortable-ghost) {
  opacity: 0.3;
}
:deep(.step-sortable-chosen) {
  box-shadow: 0 0 12px 3px rgba(77, 171, 247, 0.5);
}

.pg-editor-actions {
  display: flex;
  gap: 6px;
  padding: 6px 0 0;
  flex-wrap: wrap;
}

.pg-status-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 6px;
}
.pg-status-badge--completed {
  background: rgba(64, 192, 87, 0.18);
  color: #40c057;
}
.pg-status-badge--failed {
  background: rgba(240, 62, 62, 0.18);
  color: #f03e3e;
}
.pg-status-badge--running {
  background: rgba(59, 91, 219, 0.18);
  color: #74c0fc;
}

.pg-empty {
  padding: 6px 0;
}
.pg-host-metrics {
  border-top: 1px solid var(--border, #333);
  margin-top: 8px;
  padding-top: 6px;
}
</style>
