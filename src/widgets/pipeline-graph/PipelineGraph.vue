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
      <!-- Topology selector -->
      <div class="pg-topology-selector">
        <label class="pg-topology-label">{{ t("graph.layout") }}:</label>
        <div class="pg-topology-buttons">
          <button
            v-for="topologyOption in TOPOLOGIES"
            :key="topologyOption.id"
            class="pg-topo-btn"
            :class="{ 'pg-topo-btn--active': topo === topologyOption.id }"
            @click="$emit('update:topology', topologyOption.id)"
          >
            {{ topologyOption.icon }} {{ topologyOption.id }}
          </button>
        </div>
      </div>
      <div class="hint pg-layout-hint">{{ t("graph.layoutHelp") }}</div>

      <div
        v-if="editorSteps && steps.length > recommendedCount * 2"
        class="pg-reset-recommended"
      >
        <span class="hint">{{
          t("graph.pipelineHeavyHint", {
            n: steps.length,
            recommended: recommendedCount,
          })
        }}</span>
        <button
          type="button"
          class="pg-reset-btn"
          :title="t('graph.resetRecommendedTitle')"
          @click="$emit('editor:reset-recommended')"
        >
          {{ t("graph.resetRecommended") }}
        </button>
      </div>

      <template v-if="steps.length">
        <!-- ═══ LINEAR ═══ -->
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

        <!-- ═══ PARALLEL ═══ -->
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

        <!-- ═══ RING ═══ -->
        <div
          v-else-if="topo === 'ring'"
          ref="sortableContainer"
          class="step-flow step-flow--ring"
          style="position: relative"
        >
          <svg
            v-if="topoLines.length"
            class="topo-svg-overlay"
            :width="svgWidth"
            :height="svgHeight"
          >
            <defs>
              <marker
                id="arrow-ring"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#4dabf7" />
              </marker>
            </defs>
            <path
              v-for="line in topoLines"
              :key="line.id"
              :d="line.d"
              :class="line.cssClass"
              marker-end="url(#arrow-ring)"
            />
          </svg>
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

        <!-- ═══ MESH ═══ -->
        <div
          v-else-if="topo === 'mesh'"
          ref="sortableContainer"
          class="step-flow step-flow--mesh"
          style="position: relative"
        >
          <svg
            v-if="topoLines.length"
            class="topo-svg-overlay"
            :width="svgWidth"
            :height="svgHeight"
          >
            <path
              v-for="line in topoLines"
              :key="line.id"
              :d="line.d"
              :class="line.cssClass"
            />
          </svg>
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

      <!-- Add / Reset -->
      <div v-if="editorSteps" class="pg-editor-actions">
        <button class="btn-secondary" @click="$emit('editor:add')">
          + {{ t("graph.add") }}
        </button>
        <button class="btn-ghost" @click="$emit('editor:reset')">
          {{ t("graph.reset") }}
        </button>
      </div>

      <!-- Node taxonomy legend (P3.2 Этап 1) -->
      <div class="pg-legend">
        <span class="pg-legend-title">Legend:</span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--agent" />Agent
        </span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--reviewer" />Reviewer
        </span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--verification" />Verification
        </span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--human_gate" />Human Gate
        </span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--tool_preflight" />Preflight
        </span>
        <span class="pg-legend-item">
          <span class="pg-legend-pip pg-legend-pip--join_branch" />Join
        </span>
      </div>

      <div class="pg-host-metrics">
        <HostMetrics :metrics="hostMetrics ?? null" />
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import Sortable from "sortablejs";
import HostMetrics from "@/widgets/task-panel/HostMetrics.vue";
import StepCard from "@/widgets/pipeline-graph/StepCard.vue";
import PipelineSummary from "@/widgets/pipeline-graph/PipelineSummary.vue";
import { useTopologyConnections } from "@/widgets/pipeline-graph/useTopologyConnections";
import { recommendedStepsForTopology } from "@/features/pipeline/topologyPresets";
import {
  usePipelineGraphLayout,
  type GraphStepRef,
} from "@/widgets/pipeline-graph/usePipelineGraphLayout";
import type { PipeStep } from "@/features/pipeline/usePipeline";
import type { HostMetrics as HostMetricsType } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";

const TOPOLOGIES = [
  { id: "linear", icon: "⟶" },
  { id: "parallel", icon: "∥" },
  { id: "ring", icon: "↺" },
  { id: "mesh", icon: "⬡" },
] as const;

const props = defineProps<{
  steps: string[];
  topology?: string;
  activeStep?: string | null;
  completedSteps?: string[];
  failedStep?: string;
  skippedSteps?: string[];
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
const sortableInstance = ref<Sortable | null>(null);

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

// ── SortableJS ────────────────────────────────────────────────────────────

function destroySortable(): void {
  if (sortableInstance.value) {
    try {
      sortableInstance.value.destroy();
    } catch {
      /* */
    }
    sortableInstance.value = null;
  }
}

function initSortable(): void {
  destroySortable();
  if (!sortableContainer.value || !props.editorSteps) return;

  const currentTopo = topo.value;
  const draggable = currentTopo === "parallel" ? ".step-stage" : ".step-card";

  sortableInstance.value = Sortable.create(sortableContainer.value, {
    animation: 200,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    handle: ".step-drag-handle",
    draggable,
    filter: ".step-remove-btn, .step-select",
    preventOnFilter: false,
    ghostClass: "step-sortable-ghost",
    chosenClass: "step-sortable-chosen",
    dragClass: "step-sortable-drag",
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    swapThreshold: 0.65,
    invertSwap: true,
    group:
      currentTopo === "parallel"
        ? { name: "stages", pull: true, put: true }
        : undefined,
    onEnd(evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex)
        return;

      // When a whole stage is dragged, translate stage-position into
      // a flat (oldStart, newStart, count) tuple. Bug (2026-04): parallel
      // stages containing >1 card only moved the first — the remaining
      // cards stayed at the old flat position. reorder now supports a
      // count argument so the entire stage moves together.
      // reorder() expects a *pre-removal* destination index: the flat index
      // in the original (pre-drag) array where the moved item(s) should be
      // inserted AFTER the splice removes them.  For a forward move (new >
      // old) the SortableJS newIndex points to the stage/card that becomes
      // the right-hand neighbour AFTER the move — we must include that
      // neighbour's content in the prefix sum so that the insertion lands
      // after it.  Backward moves are already correct as-is.
      if (currentTopo === "parallel") {
        const stages = parallelStages.value;
        const stage = stages[oldIndex];
        const oldFlat = stages.slice(0, oldIndex).flat().length;
        const newFlat =
          newIndex > oldIndex
            ? stages.slice(0, newIndex + 1).flat().length
            : stages.slice(0, newIndex).flat().length;
        emit("editor:reorder", oldFlat, newFlat, stage?.length ?? 1);
      } else {
        // Linear / ring / mesh: SortableJS newIndex is the *final* position
        // of the card in the result array (post-removal). For a forward move
        // the pre-removal index is newIndex + 1; backward stays the same.
        const preRemovalNew = newIndex > oldIndex ? newIndex + 1 : newIndex;
        emit("editor:reorder", oldIndex, preRemovalNew, 1);
      }
    },
  });
}

onMounted(() => nextTick(initSortable));
onUnmounted(destroySortable);
// Re-init when the rendered step list changes. When editing we watch
// editorStepIds (the configured list); otherwise watch display steps.
watch(
  () => (editorStepIds.value.length ? editorStepIds.value : props.steps).join("\u0000"),
  () => nextTick(initSortable),
);
watch(topo, () => nextTick(initSortable));

const stepCountRef = computed(() => props.steps.length);
const {
  lines: topoLines,
  svgWidth,
  svgHeight,
} = useTopologyConnections(sortableContainer, topo, stepCountRef);
</script>

<style scoped>
/* ═══ LINEAR ════════════════════════════════════════════════ */
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

/* ═══ PARALLEL ══════════════════════════════════════════════ */
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

/* ═══ RING ══════════════════════════════════════════════════ */
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

/* ═══ MESH ══════════════════════════════════════════════════ */
.step-flow--mesh {
  display: grid;
  grid-template-columns: repeat(3, auto);
  gap: 10px;
  justify-content: start;
  padding: 4px 0 8px;
}

/* ═══ CARD (shared via StepCard) ════════════════════════════ */
:deep(.step-card) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 82px;
  min-height: 80px;
  padding: 8px 6px 6px;
  border-radius: 8px;
  border: 2px solid var(--border, #444);
  background: var(--bg2, #1e1e1e);
  position: relative;
  transition:
    border-color 0.3s,
    background 0.3s,
    box-shadow 0.3s;
}
:deep(.step-card--parallel-sibling) {
  border-style: dashed;
}

/* drag handle */
:deep(.step-drag-handle) {
  position: absolute;
  top: 2px;
  left: 4px;
  cursor: grab;
  color: var(--text3, #555);
  font-size: 10px;
  user-select: none;
  opacity: 0.5;
  transition: opacity 0.15s;
}
:deep(.step-card:hover .step-drag-handle) {
  opacity: 1;
}

/* remove btn */
:deep(.step-remove-btn) {
  position: absolute;
  top: 1px;
  right: 3px;
  background: none;
  border: none;
  color: var(--text3, #666);
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s;
}
:deep(.step-card:hover .step-remove-btn) {
  opacity: 0.7;
}
:deep(.step-remove-btn:hover) {
  color: #f03e3e;
  opacity: 1 !important;
}

/* select */
:deep(.step-select) {
  font-size: 8px;
  text-align: center;
  color: var(--text2, #aaa);
  background: transparent;
  border: none;
  outline: none;
  max-width: 72px;
  margin-top: 2px;
  cursor: pointer;
  padding: 1px 0;
}
:deep(.step-select:focus) {
  color: var(--text1, #eee);
}

/* emoji */
:deep(.step-emoji) {
  font-size: 20px;
  line-height: 1;
  display: block;
  text-align: center;
}
:deep(.step-emoji--bob) {
  animation: emoji-bob 1.5s ease-in-out infinite;
}

/* name */
:deep(.step-name) {
  font-size: 9px;
  text-align: center;
  color: var(--text2, #aaa);
  line-height: 1.2;
  word-break: break-word;
  max-width: 100%;
  margin-top: 4px;
}

/* badge */
:deep(.step-badge) {
  margin-top: 4px;
  min-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
:deep(.badge-done) {
  color: #40c057;
  font-weight: 700;
  font-size: 12px;
}
:deep(.badge-fail) {
  color: #f03e3e;
  font-weight: 700;
  font-size: 12px;
}
:deep(.badge-skip) {
  color: #f59f00;
  font-size: 11px;
}

/* dots */
:deep(.dots) {
  display: flex;
  gap: 3px;
  align-items: center;
}
:deep(.dot) {
  font-size: 7px;
  color: var(--accent, #f4c15d);
  animation: dot-bounce 1.4s ease-in-out infinite;
  display: inline-block;
}
:deep(.dot-1) {
  animation-delay: 0s;
}
:deep(.dot-2) {
  animation-delay: 0.2s;
}
:deep(.dot-3) {
  animation-delay: 0.4s;
}

/* ═══ Status variants ══════════════════════════════════════ */
:deep(.step-card--pending) {
  opacity: 0.5;
  border-color: var(--border, #444);
}
:deep(.step-card--in_progress) {
  opacity: 1;
  border-color: var(--accent, #f4c15d);
  background: rgba(244, 193, 93, 0.07);
  box-shadow:
    0 0 0 1px rgba(244, 193, 93, 0.18),
    0 4px 18px rgba(244, 193, 93, 0.12);
  animation: glow-pulse 1.8s ease-in-out infinite;
}
:deep(.step-card--in_progress .step-name),
:deep(.step-card--in_progress .step-select) {
  color: var(--accent, #f4c15d);
  font-weight: 600;
}
:deep(.step-card--completed) {
  opacity: 1;
  border-color: #40c057;
  border-width: 2px;
  background: rgba(64, 192, 87, 0.08);
  animation: glow-done 2s ease-in-out infinite;
}
:deep(.step-card--completed .step-name),
:deep(.step-card--completed .step-select) {
  color: #40c057;
}
:deep(.step-card--failed) {
  opacity: 1;
  border-color: #f03e3e;
  border-width: 2px;
  background: rgba(240, 62, 62, 0.08);
  box-shadow: 0 0 10px 2px rgba(240, 62, 62, 0.4);
}
:deep(.step-card--failed .step-name) {
  color: #f03e3e;
}
:deep(.step-card--failed .step-emoji) {
  animation: shake-once 0.5s ease-in-out;
}
:deep(.step-card--skipped) {
  opacity: 0.85;
  border: 2px dashed #f59f00;
  background: rgba(245, 159, 0, 0.06);
}
:deep(.step-card--skipped .step-name) {
  color: #f59f00;
}

/* sortable */
:deep(.step-sortable-ghost) {
  opacity: 0.3;
}
:deep(.step-sortable-chosen) {
  box-shadow: 0 0 12px 3px rgba(77, 171, 247, 0.5);
}

/* ═══ Editor actions ═══════════════════════════════════════ */
.pg-editor-actions {
  display: flex;
  gap: 6px;
  padding: 6px 0 0;
  flex-wrap: wrap;
}

.pg-reset-recommended {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  margin: 8px 0;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.35);
  border-radius: 4px;
  font-size: 12px;
}
.pg-reset-recommended .hint {
  flex: 1;
  color: #fcd67a;
}
.pg-reset-btn {
  padding: 3px 10px;
  font-size: 11px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.55);
  border-radius: 4px;
  color: #fcd67a;
  cursor: pointer;
}
.pg-reset-btn:hover {
  background: rgba(245, 158, 11, 0.3);
}

/* ═══ Topology selector ═══════════════════════════════════ */
.pg-topology-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px;
  border-bottom: 1px solid var(--border, #333);
  margin-bottom: 8px;
}
.pg-topology-label {
  font-size: 10px;
  color: var(--text3, #666);
  user-select: none;
}
.pg-topology-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.pg-topo-btn {
  background: transparent;
  border: 1px solid var(--border, #444);
  border-radius: 4px;
  color: var(--text2, #aaa);
  font-size: 10px;
  padding: 2px 7px;
  cursor: pointer;
  transition: all 0.15s;
}
.pg-topo-btn:hover {
  border-color: #4dabf7;
  color: #4dabf7;
}
.pg-topo-btn--active {
  border-color: #4dabf7;
  color: #4dabf7;
  background: rgba(77, 171, 247, 0.1);
}

/* ═══ Status badge ═════════════════════════════════════════ */
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

/* ═══ Node taxonomy legend ═══════════════════════════════════ */
.pg-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 0 2px;
  border-top: 1px solid var(--border, #333);
  margin-top: 8px;
}
.pg-legend-title {
  font-size: 9px;
  color: var(--text3, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}
.pg-legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  color: var(--text3, #666);
  user-select: none;
}
.pg-legend-pip {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pg-legend-pip--agent {
  background: #4dabf7;
}
.pg-legend-pip--reviewer {
  background: #f59f00;
  border-radius: 2px;
}
.pg-legend-pip--verification {
  background: #40c057;
  border-radius: 1px;
}
.pg-legend-pip--human_gate {
  background: #cc5de8;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  border-radius: 0;
}
.pg-legend-pip--tool_preflight {
  background: #74c0fc;
  border-radius: 0;
}
.pg-legend-pip--join_branch {
  background: #a9e34b;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  border-radius: 0;
}

/* SVG topology connections */
.topo-svg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}
:deep(.topo-conn-ring) {
  fill: none;
  stroke: #4dabf7;
  stroke-width: 1.5;
  stroke-dasharray: 6 3;
  opacity: 0.6;
}
:deep(.topo-conn-mesh) {
  fill: none;
  stroke: #7950f2;
  stroke-width: 0.8;
  stroke-dasharray: 4 4;
  opacity: 0.25;
}

/* ═══ Keyframes ════════════════════════════════════════════ */
@keyframes dot-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes emoji-bob {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.18);
  }
}
@keyframes glow-pulse {
  0%,
  100% {
    box-shadow: 0 0 6px 1px rgba(59, 91, 219, 0.3);
  }
  50% {
    box-shadow: 0 0 16px 4px rgba(59, 91, 219, 0.7);
  }
}
@keyframes glow-done {
  0%,
  100% {
    box-shadow: 0 0 6px 1px rgba(64, 192, 87, 0.4);
  }
  50% {
    box-shadow: 0 0 14px 3px rgba(64, 192, 87, 0.7);
  }
}
@keyframes border-color-cycle {
  0% {
    border-color: #3b5bdb;
  }
  25% {
    border-color: #7950f2;
  }
  50% {
    border-color: #4dabf7;
  }
  75% {
    border-color: #7950f2;
  }
  100% {
    border-color: #3b5bdb;
  }
}
@keyframes shake-once {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-3px);
  }
  80% {
    transform: translateX(3px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
