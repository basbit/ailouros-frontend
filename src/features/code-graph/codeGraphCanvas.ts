import type { CodeGraphResponse } from "./model/types";

interface CodeGraphCanvasNode {
  id: string;
  title: string;
  tags: string[];
  color: string;
  size: number;
}

interface CodeGraphCanvasEdge {
  id: string;
  source: string;
  target: string;
  kind: string;
}

export interface CodeGraphCanvasData {
  nodes: CodeGraphCanvasNode[];
  edges: CodeGraphCanvasEdge[];
}

export interface CodeGraphFileLegendEntry {
  filePath: string;
  color: string;
}

const FILE_PALETTE = [
  "#4dabf7",
  "#51cf66",
  "#ff922b",
  "#a162e8",
  "#f06595",
  "#20c997",
  "#fcc419",
  "#748ffc",
  "#ff6b6b",
  "#66d9e8",
];

const NODE_SIZE = 10;

function colorByFile(data: CodeGraphResponse): Map<string, string> {
  const files = [...new Set(data.nodes.map((node) => node.file_path))].sort();
  return new Map(
    files.map((file, index) => [file, FILE_PALETTE[index % FILE_PALETTE.length]]),
  );
}

export function buildCodeGraphFileLegend(
  data: CodeGraphResponse,
): CodeGraphFileLegendEntry[] {
  return [...colorByFile(data)].map(([filePath, color]) => ({ filePath, color }));
}

export function toCodeGraphCanvasData(
  data: CodeGraphResponse,
  edgeKind: string,
): CodeGraphCanvasData {
  const fileColors = colorByFile(data);
  const nodeIds = new Set(data.nodes.map((node) => node.node_id));

  const nodes: CodeGraphCanvasNode[] = data.nodes.map((node) => ({
    id: node.node_id,
    title: node.qualified_name,
    tags: [node.kind, node.file_path],
    color: fileColors.get(node.file_path) ?? FILE_PALETTE[0],
    size: NODE_SIZE,
  }));

  const edges: CodeGraphCanvasEdge[] = data.edges
    .filter(
      (edge) =>
        (!edgeKind || edge.kind === edgeKind) &&
        nodeIds.has(edge.src_id) &&
        nodeIds.has(edge.dst_id),
    )
    .map((edge, index) => ({
      id: `${edge.src_id}|${edge.kind}|${edge.dst_id}|${index}`,
      source: edge.src_id,
      target: edge.dst_id,
      kind: edge.kind,
    }));

  return { nodes, edges };
}
