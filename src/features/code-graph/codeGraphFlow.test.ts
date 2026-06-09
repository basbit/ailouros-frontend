import { describe, it, expect } from "vitest";

import { toFlowGraph } from "@/features/code-graph/codeGraphFlow";
import type { CodeGraphResponse } from "@/shared/model/code-graph-types";

function node(
  id: string,
  file: string,
  name: string,
): CodeGraphResponse["nodes"][number] {
  return {
    node_id: id,
    file_path: file,
    kind: "function",
    name,
    qualified_name: name,
    line_start: 1,
    line_end: 2,
    scope_id: null,
  };
}

const DATA: CodeGraphResponse = {
  nodes: [
    node("a.py::f", "a.py", "f"),
    node("a.py::g", "a.py", "g"),
    node("b.py::h", "b.py", "h"),
  ],
  edges: [
    {
      src_id: "a.py::f",
      dst_id: "a.py::g",
      kind: "calls",
      weight: 1,
      call_site_line: 1,
    },
    {
      src_id: "a.py::f",
      dst_id: "external",
      kind: "imports",
      weight: 1,
      call_site_line: null,
    },
  ],
  report: {
    node_count: 3,
    edge_count: 2,
    top_called: [],
    entry_points: [],
    orphans: [],
    cyclic_symbols: [],
  },
};

describe("toFlowGraph", () => {
  it("maps every node to a positioned flow node", () => {
    const flow = toFlowGraph(DATA, "");
    expect(flow.nodes).toHaveLength(3);
    const f = flow.nodes.find((n) => n.id === "a.py::f");
    expect(f?.data.label).toBe("f");
    expect(typeof f?.position.x).toBe("number");
  });

  it("drops edges whose endpoints are outside the graph", () => {
    const flow = toFlowGraph(DATA, "");
    expect(flow.edges).toHaveLength(1);
    expect(flow.edges[0].source).toBe("a.py::f");
    expect(flow.edges[0].target).toBe("a.py::g");
  });

  it("filters edges by kind", () => {
    expect(toFlowGraph(DATA, "calls").edges).toHaveLength(1);
    expect(toFlowGraph(DATA, "imports").edges).toHaveLength(0);
  });

  it("places same-file nodes in one column and different files in different columns", () => {
    const flow = toFlowGraph(DATA, "");
    const f = flow.nodes.find((n) => n.id === "a.py::f");
    const g = flow.nodes.find((n) => n.id === "a.py::g");
    const h = flow.nodes.find((n) => n.id === "b.py::h");
    expect(f?.position.x).toBe(g?.position.x);
    expect(f?.position.x).not.toBe(h?.position.x);
    expect(f?.position.y).not.toBe(g?.position.y);
  });
});
