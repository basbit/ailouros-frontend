<template>
  <div class="code-graph-canvas">
    <label class="cg-canvas-filter">
      {{ t("configure.codeGraph.kind") }}
      <select v-model="edgeKind">
        <option value="">{{ t("configure.codeGraph.all") }}</option>
        <option v-for="kind in edgeKinds" :key="kind" :value="kind">{{ kind }}</option>
      </select>
    </label>
    <div class="cg-canvas-legend">
      <span
        v-for="entry in fileLegend"
        :key="entry.filePath"
        class="cg-canvas-legend-item"
      >
        <span class="cg-canvas-legend-dot" :style="{ background: entry.color }" />
        {{ entry.filePath }}
      </span>
    </div>
    <div class="cg-canvas-viewport">
      <GraphCanvas :data="canvasData" search="" @node-click="onNodeClick" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { GraphCanvas } from "@/features/graph-canvas";
import {
  buildCodeGraphFileLegend,
  toCodeGraphCanvasData,
} from "@/features/code-graph/codeGraphCanvas";
import type { CodeGraphResponse } from "@/features/code-graph/model/types";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ data: CodeGraphResponse }>();
const emit = defineEmits<{ (event: "select", nodeId: string): void }>();
const { t } = useI18n();
const edgeKind = ref("");

const edgeKinds = computed(() =>
  [...new Set(props.data.edges.map((edge) => edge.kind))].sort(),
);

const fileLegend = computed(() => buildCodeGraphFileLegend(props.data));

const canvasData = computed(() => toCodeGraphCanvasData(props.data, edgeKind.value));

function onNodeClick(nodeId: string): void {
  emit("select", nodeId);
}
</script>

<style scoped>
.code-graph-canvas {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cg-canvas-filter {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}
.cg-canvas-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--text2, #888);
}
.cg-canvas-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}
.cg-canvas-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.cg-canvas-viewport {
  height: 28rem;
  border: 1px solid var(--color-border, #d0d0d0);
  border-radius: 6px;
  overflow: hidden;
}
</style>
