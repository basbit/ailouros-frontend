import type { CodeGraphResponse } from "@/shared/model/code-graph-types";

interface FlowNode {
  id: string;
  position: { x: number; y: number };
  data: { label: string; kind: string; path: string };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  class: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const COLUMN_WIDTH = 280;
const ROW_HEIGHT = 70;

export function toFlowGraph(data: CodeGraphResponse, edgeKind: string): FlowGraph {
  const files = [...new Set(data.nodes.map((n) => n.file_path))].sort();
  const columnByFile = new Map(files.map((file, index) => [file, index]));
  const rowByFile = new Map<string, number>();
  const nodeIds = new Set(data.nodes.map((n) => n.node_id));

  const nodes: FlowNode[] = data.nodes.map((n) => {
    const column = columnByFile.get(n.file_path) ?? 0;
    const row = rowByFile.get(n.file_path) ?? 0;
    rowByFile.set(n.file_path, row + 1);
    return {
      id: n.node_id,
      position: { x: column * COLUMN_WIDTH, y: row * ROW_HEIGHT },
      data: { label: n.qualified_name, kind: n.kind, path: n.file_path },
    };
  });

  const edges: FlowEdge[] = data.edges
    .filter(
      (e) =>
        (!edgeKind || e.kind === edgeKind) &&
        nodeIds.has(e.src_id) &&
        nodeIds.has(e.dst_id),
    )
    .map((e, index) => ({
      id: `${e.src_id}|${e.kind}|${e.dst_id}|${index}`,
      source: e.src_id,
      target: e.dst_id,
      label: e.kind,
      class: `cg-edge-${e.kind}`,
    }));

  return { nodes, edges };
}
