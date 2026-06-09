import { describe, it, expect } from "vitest";

import { parseCodeGraphResponse } from "@/shared/model/code-graph-types";

const VALID_REPORT = {
  node_count: 0,
  edge_count: 0,
  top_called: [],
  entry_points: [],
  orphans: [],
  cyclic_symbols: [],
};

describe("parseCodeGraphResponse", () => {
  it("returns null for non-object input", () => {
    expect(parseCodeGraphResponse(null)).toBeNull();
    expect(parseCodeGraphResponse("nope")).toBeNull();
    expect(parseCodeGraphResponse(42)).toBeNull();
  });

  it("returns null when nodes or edges are not arrays", () => {
    expect(
      parseCodeGraphResponse({ nodes: "x", edges: [], report: VALID_REPORT }),
    ).toBeNull();
    expect(
      parseCodeGraphResponse({ nodes: [], edges: null, report: VALID_REPORT }),
    ).toBeNull();
  });

  it("returns null when report is missing or malformed", () => {
    expect(parseCodeGraphResponse({ nodes: [], edges: [] })).toBeNull();
    expect(
      parseCodeGraphResponse({
        nodes: [],
        edges: [],
        report: { node_count: "x", edge_count: 0 },
      }),
    ).toBeNull();
  });

  it("parses a valid payload and coerces fields", () => {
    const parsed = parseCodeGraphResponse({
      nodes: [
        {
          node_id: "a",
          file_path: "a.py",
          kind: "function",
          name: "f",
          qualified_name: "f",
          line_start: 1,
          line_end: 2,
          scope_id: null,
        },
      ],
      edges: [
        { src_id: "a", dst_id: "b", kind: "calls", weight: 1, call_site_line: 3 },
      ],
      report: {
        node_count: 1,
        edge_count: 1,
        top_called: [{ qualified_name: "b", callers: 1 }],
        entry_points: ["f"],
        orphans: [],
      },
    });
    expect(parsed?.nodes[0].qualified_name).toBe("f");
    expect(parsed?.edges[0].kind).toBe("calls");
    expect(parsed?.report.node_count).toBe(1);
  });

  it("defaults missing optional report arrays to empty", () => {
    const parsed = parseCodeGraphResponse({
      nodes: [],
      edges: [],
      report: { node_count: 0, edge_count: 0 },
    });
    expect(parsed?.report.top_called).toEqual([]);
    expect(parsed?.report.entry_points).toEqual([]);
    expect(parsed?.report.orphans).toEqual([]);
  });
});
