<template>
  <div class="code-graph-flow">
    <label class="cg-flow-filter">
      {{ t("configure.codeGraph.kind") }}
      <select v-model="edgeKind">
        <option value="">{{ t("configure.codeGraph.all") }}</option>
        <option v-for="kind in edgeKinds" :key="kind" :value="kind">{{ kind }}</option>
      </select>
    </label>
    <div class="cg-flow-canvas">
      <VueFlow
        :nodes="flow.nodes"
        :edges="flow.edges"
        :min-zoom="0.1"
        :fit-view-on-init="true"
        @node-click="onNodeClick"
      >
        <Background />
        <Controls />
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { VueFlow, type NodeMouseEvent } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/controls/dist/style.css";

import { toFlowGraph } from "@/features/code-graph/codeGraphFlow";
import type { CodeGraphResponse } from "@/shared/model/code-graph-types";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ data: CodeGraphResponse }>();
const emit = defineEmits<{ (event: "select", nodeId: string): void }>();
const { t } = useI18n();
const edgeKind = ref("");

const edgeKinds = computed(() =>
  [...new Set(props.data.edges.map((edge) => edge.kind))].sort(),
);

const flow = computed(() => toFlowGraph(props.data, edgeKind.value));

function onNodeClick(event: NodeMouseEvent): void {
  const nodeId = event.node?.id;
  if (nodeId) emit("select", nodeId);
}
</script>

<style scoped>
.code-graph-flow {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cg-flow-filter {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
}
.cg-flow-canvas {
  height: 28rem;
  border: 1px solid var(--color-border, #d0d0d0);
  border-radius: 6px;
}
</style>
