import { computed, ref } from "vue";
import type { PipelineNode } from "./types";

const NODE_COLORS: Record<string, string> = {
  trigger: "#868e96",
  agent: "#4dabf7",
  tool: "#51cf66",
  condition: "#ffd43b",
  aggregator: "#cc5de8",
  output: "#495057",
};

export { NODE_COLORS };

function nodeColorFor(nodeType: string): string {
  return NODE_COLORS[nodeType] ?? "#4a5578";
}

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: unknown; config: unknown };
  style: { background: string; borderRadius: string; border: string };
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label: string | undefined;
}

interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface PipelineData {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

interface CanvasCallbacks {
  addNode: (type: PipelineNode["type"], position: { x: number; y: number }) => void;
  updateNode: (id: string, patch: Partial<PipelineNode>) => void;
  removeNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string) => void;
}

export function useAgentEditorCanvas(
  pipeline: { value: PipelineData },
  selectedNode: { value: PipelineNode | null },
  callbacks: CanvasCallbacks,
) {
  const canvasWrapRef = ref<HTMLDivElement | null>(null);

  const vueFlowNodes = computed<CanvasNode[]>(() =>
    pipeline.value.nodes.map((node) => {
      const config = node.config as Record<string, unknown>;
      const isOfficial = config.official === true;
      const isSelected = node.id === selectedNode.value?.id;
      let borderColor = "transparent";
      if (isSelected) {
        borderColor = "#fff";
      } else if (!isOfficial) {
        borderColor = "#fab005";
      }
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: config.name ?? node.type,
          config: node.config,
        },
        style: {
          background: nodeColorFor(node.type),
          borderRadius: "8px",
          border: `2px solid ${borderColor}`,
        },
      };
    }),
  );

  const vueFlowEdges = computed<CanvasEdge[]>(() =>
    pipeline.value.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
    })),
  );

  let dragNodeType: PipelineNode["type"] | null = null;

  function onDragStart(event: DragEvent, type: PipelineNode["type"]): void {
    dragNodeType = type;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function onDrop(event: DragEvent): void {
    if (!dragNodeType || !canvasWrapRef.value) return;
    const rect = canvasWrapRef.value.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    callbacks.addNode(dragNodeType, position);
    dragNodeType = null;
  }

  function onVfNodeClick(event: { node: { id: string } }): void {
    callbacks.selectNode(event.node.id);
  }

  function onConnect(params: { source: string; target: string }): void {
    callbacks.addEdge(params.source, params.target);
  }

  function onEdgesDelete(edges: { id: string }[]): void {
    for (const edge of edges) callbacks.removeEdge(edge.id);
  }

  function onNodesDelete(nodes: { id: string }[]): void {
    for (const node of nodes) callbacks.removeNode(node.id);
  }

  function onNodeDragStop(event: {
    node: { id: string; position: { x: number; y: number } };
  }): void {
    callbacks.updateNode(event.node.id, { position: event.node.position });
  }

  function updateSelectedNode(patch: Partial<PipelineNode>): void {
    if (selectedNode.value) callbacks.updateNode(selectedNode.value.id, patch);
  }

  return {
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
  };
}
