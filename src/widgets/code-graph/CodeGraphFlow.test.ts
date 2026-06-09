import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";

import CodeGraphFlow from "./CodeGraphFlow.vue";
import type { CodeGraphResponse } from "@/shared/model/code-graph-types";

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
  ],
  edges: [],
  report: {
    node_count: 1,
    edge_count: 0,
    top_called: [],
    entry_points: [],
    orphans: [],
    cyclic_symbols: [],
  },
};

const VueFlowStub = {
  name: "VueFlow",
  props: ["nodes", "edges"],
  emits: ["node-click"],
  template:
    '<div class="vf-stub" @click="$emit(\'node-click\', { node: { id: nodes[0]?.id } })"><slot /></div>',
};

function mountFlow() {
  return mount(CodeGraphFlow, {
    props: { data: DATA },
    global: {
      stubs: {
        VueFlow: VueFlowStub,
        Background: true,
        Controls: true,
      },
    },
  });
}

describe("CodeGraphFlow", () => {
  it("emits select with the clicked node id", async () => {
    const wrapper = mountFlow();
    await wrapper.find(".vf-stub").trigger("click");
    const emitted = wrapper.emitted("select");
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]).toEqual(["a.py::run"]);
  });
});
