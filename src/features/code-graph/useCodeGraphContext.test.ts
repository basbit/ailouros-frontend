import { describe, it, expect, vi, beforeEach } from "vitest";

import { useCodeGraphContext } from "@/features/code-graph/useCodeGraphContext";
import * as endpoint from "@/shared/api/endpoints/codegraph";
import type { CodeGraphContext } from "@/shared/model/code-graph-types";

function node(id: string, name: string): CodeGraphContext["definition"] {
  return {
    node_id: id,
    file_path: "a.py",
    kind: "function",
    name,
    qualified_name: name,
    line_start: 1,
    line_end: 2,
    scope_id: null,
  };
}

const SAMPLE: CodeGraphContext = {
  node_id: "a.py::run",
  definition: node("a.py::run", "run"),
  callers: [node("a.py::main", "main")],
  callees: [node("a.py::helper", "helper")],
};

describe("useCodeGraphContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("selects a node and loads its context", async () => {
    const spy = vi.spyOn(endpoint, "getCodeGraphContext").mockResolvedValue(SAMPLE);
    const { context, selectedId, select } = useCodeGraphContext();
    await select("/ws", "a.py::run");
    expect(spy).toHaveBeenCalledWith("/ws", "a.py::run");
    expect(selectedId.value).toBe("a.py::run");
    expect(context.value?.definition.qualified_name).toBe("run");
    expect(context.value?.callees[0].qualified_name).toBe("helper");
  });

  it("captures errors without throwing", async () => {
    vi.spyOn(endpoint, "getCodeGraphContext").mockRejectedValue(new Error("boom"));
    const { context, error, select } = useCodeGraphContext();
    await select("/ws", "a.py::run");
    expect(error.value).toContain("boom");
    expect(context.value).toBeNull();
  });

  it("clears the selection", async () => {
    vi.spyOn(endpoint, "getCodeGraphContext").mockResolvedValue(SAMPLE);
    const { context, selectedId, select, clear } = useCodeGraphContext();
    await select("/ws", "a.py::run");
    clear();
    expect(selectedId.value).toBeNull();
    expect(context.value).toBeNull();
  });

  it("ignores empty workspace or node id", async () => {
    const spy = vi.spyOn(endpoint, "getCodeGraphContext");
    const { select } = useCodeGraphContext();
    await select("", "a.py::run");
    await select("/ws", "");
    expect(spy).not.toHaveBeenCalled();
  });
});
