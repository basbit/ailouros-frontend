<template>
  <div class="agent-editor-workspace">
    <div class="agent-editor-workspace__palette">
      <div class="agent-editor-workspace__palette-title">
        {{ t("agentEditor.nodeTypes") }}
      </div>
      <div
        v-for="nodeType in availableNodeTypes"
        :key="nodeType.type"
        class="agent-editor-workspace__palette-item"
        draggable="true"
        @dragstart="onDragStart($event, nodeType.type)"
      >
        <span
          class="agent-editor-workspace__palette-dot"
          :style="{ background: nodeType.color }"
        />
        <span>{{ nodeType.label }}</span>
      </div>
    </div>

    <div
      ref="canvasWrapRef"
      class="agent-editor-workspace__canvas"
      @dragover.prevent
      @drop="onDrop"
    >
      <VueFlow
        :nodes="vueFlowNodes"
        :edges="vueFlowEdges"
        :default-viewport="{ zoom: 1 }"
        fit-view-on-init
        @node-click="onVfNodeClick"
        @connect="onConnect"
        @edges-delete="onEdgesDelete"
        @nodes-delete="onNodesDelete"
        @node-drag-stop="onNodeDragStop"
      >
        <Background />
        <MiniMap />
        <Controls />
        <template #node-agent="{ data }">
          <div class="vf-node vf-node--agent">
            <Handle type="target" :position="Position.Left" />
            <div class="vf-node__label">{{ data.label }}</div>
            <div class="vf-node__sub">{{ data.config?.model }}</div>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
        <template #node-trigger="{ data }">
          <div class="vf-node vf-node--trigger">
            <div class="vf-node__label">&#9658; {{ data.label }}</div>
            <div class="vf-node__sub">{{ data.config?.triggerType }}</div>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
        <template #node-condition="{ data }">
          <div class="vf-node vf-node--condition">
            <Handle type="target" :position="Position.Left" />
            <div class="vf-node__label">&#9670; {{ data.label }}</div>
            <Handle id="true" type="source" :position="Position.Right" />
            <Handle id="false" type="source" :position="Position.Bottom" />
          </div>
        </template>
        <template #node-tool="{ data }">
          <div class="vf-node vf-node--tool">
            <Handle type="target" :position="Position.Left" />
            <div class="vf-node__label">&#9881; {{ data.label }}</div>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
        <template #node-output="{ data }">
          <div class="vf-node vf-node--output">
            <Handle type="target" :position="Position.Left" />
            <div class="vf-node__label">&#9632; {{ data.label }}</div>
          </div>
        </template>
        <template #node-aggregator="{ data }">
          <div class="vf-node vf-node--aggregator">
            <Handle type="target" :position="Position.Left" />
            <div class="vf-node__label">&#11041; {{ data.label }}</div>
            <Handle type="source" :position="Position.Right" />
          </div>
        </template>
      </VueFlow>
    </div>

    <div v-if="selectedNode" class="agent-editor-workspace__config">
      <div class="agent-editor-workspace__config-title">
        {{ t("agentEditor.nodeConfig") }}
      </div>
      <NodeConfigPanel :node="selectedNode" @update="updateSelectedNode" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, Handle, Position } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { MiniMap } from "@vue-flow/minimap";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/minimap/dist/style.css";
import "@vue-flow/controls/dist/style.css";
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  useAgentEditorCanvas,
  NODE_COLORS,
} from "@/features/agent-editor/useAgentEditorCanvas";
import NodeConfigPanel from "@/features/agent-editor/NodeConfigPanel.vue";
import type { PipelineNode } from "@/features/agent-editor/types";

interface PipelineData {
  nodes: PipelineNode[];
  edges: { id: string; source: string; target: string; label?: string }[];
}

interface CanvasCallbacks {
  addNode: (type: PipelineNode["type"], position: { x: number; y: number }) => void;
  updateNode: (id: string, patch: Partial<PipelineNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string) => void;
}

const props = defineProps<{
  pipeline: PipelineData;
  selectedNode: PipelineNode | null;
  callbacks: CanvasCallbacks;
}>();

const { t } = useI18n();

const pipelineRef = computed(() => props.pipeline);
const selectedNodeRef = computed(() => props.selectedNode);

const availableNodeTypes = [
  {
    type: "trigger" as const,
    label: t("agentEditor.nodeType.trigger"),
    color: NODE_COLORS.trigger,
  },
  {
    type: "agent" as const,
    label: t("agentEditor.nodeType.agent"),
    color: NODE_COLORS.agent,
  },
  {
    type: "tool" as const,
    label: t("agentEditor.nodeType.tool"),
    color: NODE_COLORS.tool,
  },
  {
    type: "condition" as const,
    label: t("agentEditor.nodeType.condition"),
    color: NODE_COLORS.condition,
  },
  {
    type: "aggregator" as const,
    label: t("agentEditor.nodeType.aggregator"),
    color: NODE_COLORS.aggregator,
  },
  {
    type: "output" as const,
    label: t("agentEditor.nodeType.output"),
    color: NODE_COLORS.output,
  },
];

const {
  canvasWrapRef,
  vueFlowNodes,
  vueFlowEdges,
  onDragStart,
  onDrop,
  onVfNodeClick,
  onConnect,
  onEdgesDelete,
  onNodesDelete,
  onNodeDragStop,
  updateSelectedNode,
} = useAgentEditorCanvas(pipelineRef, selectedNodeRef, props.callbacks);
</script>

<style scoped>
.agent-editor-workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.agent-editor-workspace__palette {
  width: 140px;
  min-width: 140px;
  background: var(--bg2, #1e2230);
  border-right: 1px solid var(--border, #2a2f3e);
  padding: 8px;
  overflow-y: auto;
}
.agent-editor-workspace__palette-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2, #9dadd0);
  margin-bottom: 8px;
  font-weight: 600;
}
.agent-editor-workspace__palette-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  cursor: grab;
  font-size: 12px;
  color: var(--text1, #c8cfe8);
  user-select: none;
  margin-bottom: 4px;
  background: var(--bg, #161922);
  border: 1px solid var(--border, #2a2f3e);
  transition: background 0.1s;
}
.agent-editor-workspace__palette-item:hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 15%, var(--bg, #161922));
}
.agent-editor-workspace__palette-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.agent-editor-workspace__canvas {
  flex: 1;
  overflow: hidden;
}
.agent-editor-workspace__config {
  width: 260px;
  min-width: 260px;
  background: var(--bg2, #1e2230);
  border-left: 1px solid var(--border, #2a2f3e);
  overflow-y: auto;
  padding: 10px;
}
.agent-editor-workspace__config-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text2, #9dadd0);
  font-weight: 600;
  margin-bottom: 10px;
}
.vf-node {
  padding: 10px 14px;
  border-radius: 8px;
  min-width: 120px;
  font-size: 12px;
}
.vf-node__label {
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}
.vf-node__sub {
  font-size: 10px;
  opacity: 0.7;
  color: #fff;
}
</style>
