import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import CodeGraphCanvas from "./CodeGraphCanvas.vue";
import type { CodeGraphResponse } from "@/features/code-graph/model/types";
import type { CodeGraphCanvasData } from "@/features/code-graph/codeGraphCanvas";

const DATA: CodeGraphResponse = {
  nodes: [
    {
      node_id: "a.py::run",
      file_path: "a.py",
      kind: "function",
      name: "run",
      qualified_name: "run",
      line_start: 1,
      line_end: 2,
      scope_id: null,
    },
    {
      node_id: "b.py::helper",
      file_path: "b.py",
      kind: "function",
      name: "helper",
      qualified_name: "helper",
      line_start: 1,
      line_end: 2,
      scope_id: null,
    },
  ],
  edges: [
    {
      src_id: "a.py::run",
      dst_id: "b.py::helper",
      kind: "calls",
      weight: 1,
      call_site_line: 1,
    },
    {
      src_id: "b.py::helper",
      dst_id: "a.py::run",
      kind: "imports",
      weight: 1,
      call_site_line: null,
    },
  ],
  report: {
    node_count: 2,
    edge_count: 2,
    top_called: [],
    entry_points: [],
    orphans: [],
    cyclic_symbols: [],
  },
};

const GraphCanvasStub = {
  name: "GraphCanvas",
  props: ["data", "search"],
  emits: ["nodeClick"],
  template:
    '<div class="canvas-stub" @click="$emit(\'nodeClick\', data.nodes[0]?.id)" />',
};

function mountCanvas() {
  return mount(CodeGraphCanvas, {
    props: { data: DATA },
    global: { stubs: { GraphCanvas: GraphCanvasStub } },
  });
}

function canvasData(wrapper: ReturnType<typeof mountCanvas>): CodeGraphCanvasData {
  return wrapper.getComponent({ name: "GraphCanvas" }).props("data");
}

describe("CodeGraphCanvas", () => {
  it("emits select with the clicked node id", async () => {
    const wrapper = mountCanvas();
    await wrapper.find(".canvas-stub").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["a.py::run"]]);
  });

  it("passes all nodes and edges to the canvas by default", () => {
    const data = canvasData(mountCanvas());
    expect(data.nodes).toHaveLength(2);
    expect(data.edges).toHaveLength(2);
  });

  it("narrows canvas edges when an edge kind is selected", async () => {
    const wrapper = mountCanvas();
    await wrapper.find("select").setValue("calls");
    const data = canvasData(wrapper);
    expect(data.edges).toHaveLength(1);
    expect(data.edges[0].kind).toBe("calls");
  });

  it("offers each edge kind as a filter option", () => {
    const options = mountCanvas()
      .find("select")
      .findAll("option")
      .map((option) => option.element.value);
    expect(options).toEqual(["", "calls", "imports"]);
  });

  it("renders a legend entry per file", () => {
    const legendItems = mountCanvas().findAll(".cg-canvas-legend-item");
    expect(legendItems.map((item) => item.text())).toEqual(["a.py", "b.py"]);
  });
});
