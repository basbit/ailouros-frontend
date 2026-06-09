import { describe, it, expect, vi } from "vitest";

import { useCodeGraph } from "@/features/code-graph/useCodeGraph";
import * as endpoint from "@/shared/api/endpoints/codegraph";
import type { CodeGraphResponse } from "@/shared/model/code-graph-types";

const SAMPLE: CodeGraphResponse = {
  nodes: [
    {
      node_id: "a.py::helper",
      file_path: "a.py",
      kind: "function",
      name: "helper",
      qualified_name: "helper",
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
    entry_points: ["helper"],
    orphans: [],
    cyclic_symbols: [],
  },
};

describe("useCodeGraph", () => {
  it("loads the graph for a workspace", async () => {
    vi.spyOn(endpoint, "getCodeGraph").mockResolvedValue(SAMPLE);
    const { data, loading, error, load } = useCodeGraph();
    await load("/ws");
    expect(error.value).toBeNull();
    expect(data.value?.report.node_count).toBe(1);
    expect(loading.value).toBe(false);
  });

  it("reports an error when no workspace is selected", async () => {
    const { error, load } = useCodeGraph();
    await load("");
    expect(error.value).toBeTruthy();
  });

  it("captures endpoint failures without throwing", async () => {
    vi.spyOn(endpoint, "getCodeGraph").mockRejectedValue(new Error("boom"));
    const { data, error, load } = useCodeGraph();
    await load("/ws");
    expect(error.value).toContain("boom");
    expect(data.value).toBeNull();
  });
});
