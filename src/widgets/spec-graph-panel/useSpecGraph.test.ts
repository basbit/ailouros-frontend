import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn<(path: string) => Promise<unknown>>(),
  httpPost: vi.fn<(path: string) => Promise<unknown>>(),
  ApiError: class ApiError extends Error {
    status: number;
    body?: string;
    constructor(message: string, status: number, body?: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  },
}));

vi.mock("@/shared/api/http", () => http);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useSpecGraph", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("adapts backend payload to canvas-friendly nodes and edges", async () => {
    http.httpGet.mockResolvedValue({
      nodes: [
        { id: "spec:auth", kind: "spec", payload: { title: "Auth Spec" } },
        { id: "code:auth.ts", kind: "code", payload: {} },
        { id: "test:auth.test", kind: "test", payload: { name: "Auth Tests" } },
        { id: "prompt:auth", kind: "prompt" },
      ],
      edges: [
        { from: "spec:auth", to: "code:auth.ts", kind: "implements" },
        { from: "code:auth.ts", to: "test:auth.test", kind: "tested_by" },
      ],
    });

    const { useSpecGraph, SPEC_NODE_PALETTE } = await import("./useSpecGraph");
    const state = useSpecGraph();
    await state.load("/workspace", false);

    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/graph?workspace_root=%2Fworkspace&persist=false",
    );
    expect(state.nodes.value).toHaveLength(4);
    expect(state.nodes.value[0]).toMatchObject({
      id: "spec:auth",
      title: "Auth Spec",
      color: SPEC_NODE_PALETTE.spec,
      kind: "spec",
    });
    expect(state.nodes.value[1].title).toBe("code:auth.ts");
    expect(state.nodes.value[2].color).toBe(SPEC_NODE_PALETTE.test);
    expect(state.nodes.value[3].color).toBe(SPEC_NODE_PALETTE.prompt);
    expect(state.edges.value).toHaveLength(2);
    expect(state.edges.value[0].source).toBe("spec:auth");
    expect(state.edges.value[0].target).toBe("code:auth.ts");
    expect(state.data.value?.nodes).toHaveLength(4);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("flips notImplemented on 404 and clears data", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecGraph } = await import("./useSpecGraph");
    const state = useSpecGraph();
    await state.load("/workspace");
    expect(state.notImplemented.value).toBe(true);
    expect(state.nodes.value).toHaveLength(0);
    expect(state.edges.value).toHaveLength(0);
    expect(state.data.value).toBeNull();
    expect(state.error.value).toBeNull();
  });

  it("surfaces non-404 failures in error", async () => {
    http.httpGet.mockRejectedValue(new Error("network down"));
    const { useSpecGraph } = await import("./useSpecGraph");
    const state = useSpecGraph();
    await state.load("/workspace");
    expect(state.error.value).toBe("network down");
    expect(state.notImplemented.value).toBe(false);
  });

  it("reset clears all reactive state", async () => {
    http.httpGet.mockResolvedValue({
      nodes: [{ id: "spec:1", kind: "spec" }],
      edges: [],
    });
    const { useSpecGraph } = await import("./useSpecGraph");
    const state = useSpecGraph();
    await state.load("/workspace");
    expect(state.nodes.value).toHaveLength(1);
    state.reset();
    expect(state.nodes.value).toHaveLength(0);
    expect(state.edges.value).toHaveLength(0);
    expect(state.data.value).toBeNull();
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("omits workspace_root when blank", async () => {
    http.httpGet.mockResolvedValue({ nodes: [], edges: [] });
    const { useSpecGraph } = await import("./useSpecGraph");
    const state = useSpecGraph();
    await state.load("");
    expect(http.httpGet).toHaveBeenCalledWith("/v1/spec/graph?persist=false");
  });
});
