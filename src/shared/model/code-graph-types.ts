interface CodeGraphNode {
  node_id: string;
  file_path: string;
  kind: string;
  name: string;
  qualified_name: string;
  line_start: number;
  line_end: number;
  scope_id: string | null;
}

export interface CodeGraphContext {
  node_id: string;
  definition: CodeGraphNode;
  callers: CodeGraphNode[];
  callees: CodeGraphNode[];
}

export interface CodeGraphEdge {
  src_id: string;
  dst_id: string;
  kind: string;
  weight: number;
  call_site_line: number | null;
}

interface CodeGraphTopCalled {
  qualified_name: string;
  callers: number;
}

interface CodeGraphReport {
  node_count: number;
  edge_count: number;
  top_called: CodeGraphTopCalled[];
  entry_points: string[];
  orphans: string[];
  cyclic_symbols: string[];
}

export interface CodeGraphResponse {
  nodes: CodeGraphNode[];
  edges: CodeGraphEdge[];
  report: CodeGraphReport;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCodeGraphReport(raw: unknown): CodeGraphReport | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.node_count !== "number" || typeof raw.edge_count !== "number") {
    return null;
  }
  const topCalled = Array.isArray(raw.top_called) ? raw.top_called : [];
  return {
    node_count: raw.node_count,
    edge_count: raw.edge_count,
    top_called: topCalled.filter(isRecord).map((entry) => ({
      qualified_name: String(entry.qualified_name ?? ""),
      callers: Number(entry.callers ?? 0),
    })),
    entry_points: Array.isArray(raw.entry_points) ? raw.entry_points.map(String) : [],
    orphans: Array.isArray(raw.orphans) ? raw.orphans.map(String) : [],
    cyclic_symbols: Array.isArray(raw.cyclic_symbols)
      ? raw.cyclic_symbols.map(String)
      : [],
  };
}

function parseNode(raw: Record<string, unknown>): CodeGraphNode {
  return {
    node_id: String(raw.node_id ?? ""),
    file_path: String(raw.file_path ?? ""),
    kind: String(raw.kind ?? ""),
    name: String(raw.name ?? ""),
    qualified_name: String(raw.qualified_name ?? ""),
    line_start: Number(raw.line_start ?? 0),
    line_end: Number(raw.line_end ?? 0),
    scope_id: raw.scope_id == null ? null : String(raw.scope_id),
  };
}

function parseEdge(raw: Record<string, unknown>): CodeGraphEdge {
  return {
    src_id: String(raw.src_id ?? ""),
    dst_id: String(raw.dst_id ?? ""),
    kind: String(raw.kind ?? ""),
    weight: Number(raw.weight ?? 1),
    call_site_line: raw.call_site_line == null ? null : Number(raw.call_site_line),
  };
}

export function parseCodeGraphResponse(raw: unknown): CodeGraphResponse | null {
  if (!isRecord(raw)) return null;
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return null;
  const report = parseCodeGraphReport(raw.report);
  if (!report) return null;
  return {
    nodes: raw.nodes.filter(isRecord).map(parseNode),
    edges: raw.edges.filter(isRecord).map(parseEdge),
    report,
  };
}

function parseNodeList(raw: unknown): CodeGraphNode[] {
  return Array.isArray(raw) ? raw.filter(isRecord).map(parseNode) : [];
}

export function parseCodeGraphContext(raw: unknown): CodeGraphContext | null {
  if (!isRecord(raw)) return null;
  if (!isRecord(raw.definition)) return null;
  return {
    node_id: String(raw.node_id ?? ""),
    definition: parseNode(raw.definition),
    callers: parseNodeList(raw.callers),
    callees: parseNodeList(raw.callees),
  };
}
