import { describe, it, expect } from "vitest";

import {
  buildCodeGraphFileLegend,
  toCodeGraphCanvasData,
} from "@/features/code-graph/codeGraphCanvas";
import type { CodeGraphResponse } from "./model/types";

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
      dst_id: "b.py::h",
      kind: "imports",
      weight: 1,
      call_site_line: null,
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
    edge_count: 3,
    top_called: [],
    entry_points: [],
    orphans: [],
    cyclic_symbols: [],
  },
};

describe("toCodeGraphCanvasData", () => {
  it("maps every node with title, kind and file tags", () => {
    const canvas = toCodeGraphCanvasData(DATA, "");
    expect(canvas.nodes).toHaveLength(3);
    const f = canvas.nodes.find((n) => n.id === "a.py::f");
    expect(f?.title).toBe("f");
    expect(f?.tags).toEqual(["function", "a.py"]);
    expect(f?.size).toBeGreaterThan(0);
  });

  it("colors nodes by file: same file shares a color, different files differ", () => {
    const canvas = toCodeGraphCanvasData(DATA, "");
    const f = canvas.nodes.find((n) => n.id === "a.py::f");
    const g = canvas.nodes.find((n) => n.id === "a.py::g");
    const h = canvas.nodes.find((n) => n.id === "b.py::h");
    expect(f?.color).toBe(g?.color);
    expect(f?.color).not.toBe(h?.color);
  });

  it("drops edges whose endpoints are outside the graph", () => {
    const canvas = toCodeGraphCanvasData(DATA, "");
    expect(canvas.edges).toHaveLength(2);
    expect(canvas.edges.every((e) => e.target !== "external")).toBe(true);
  });

  it("filters edges by kind", () => {
    const calls = toCodeGraphCanvasData(DATA, "calls");
    expect(calls.edges).toHaveLength(1);
    expect(calls.edges[0].kind).toBe("calls");

    const imports = toCodeGraphCanvasData(DATA, "imports");
    expect(imports.edges).toHaveLength(1);
    expect(imports.edges[0].target).toBe("b.py::h");
  });

  it("keeps edge ids unique for repeated source/target/kind triples", () => {
    const repeated: CodeGraphResponse = {
      ...DATA,
      edges: [DATA.edges[0], DATA.edges[0]],
    };
    const canvas = toCodeGraphCanvasData(repeated, "");
    expect(new Set(canvas.edges.map((e) => e.id)).size).toBe(2);
  });
});

describe("buildCodeGraphFileLegend", () => {
  it("lists each file once with the color used by its nodes", () => {
    const legend = buildCodeGraphFileLegend(DATA);
    expect(legend.map((entry) => entry.filePath)).toEqual(["a.py", "b.py"]);

    const canvas = toCodeGraphCanvasData(DATA, "");
    const f = canvas.nodes.find((n) => n.id === "a.py::f");
    expect(legend.find((entry) => entry.filePath === "a.py")?.color).toBe(f?.color);
  });
});
