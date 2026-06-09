import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const tracesApi = vi.hoisted(() => ({
  listRetrievalTraces: vi.fn(),
  getRetrievalTrace: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/retrieval-traces", () => tracesApi);
vi.mock("@/shared/api/base", () => ({
  initApiBase: vi.fn().mockResolvedValue(undefined),
}));

const sampleListResponse = {
  version: 1,
  workspace_root: "/tmp/ws",
  traces: [
    {
      trace_id: "trace-a",
      query: "where is state",
      backend: "linear",
      started_at: "2026-05-23T00:00:00+00:00",
      total_duration_ms: 11.4,
      final_verdict: "ok",
      stage_count: 2,
    },
  ],
};

const sampleDetail = {
  ...sampleListResponse.traces[0],
  workspace_root: "/tmp/ws",
  final_candidate_ids: ["architecture#memory"],
  stages: [
    {
      name: "base_search",
      started_at: "2026-05-23T00:00:00+00:00",
      duration_ms: 9.2,
      details: { hit_count: 3, top_score: 1.5 },
    },
    {
      name: "rerank",
      started_at: "2026-05-23T00:00:00+00:00",
      duration_ms: 2.2,
      details: { candidates_in: 3, candidates_out: 3 },
    },
  ],
};

beforeEach(() => {
  tracesApi.listRetrievalTraces.mockReset();
  tracesApi.getRetrievalTrace.mockReset();
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useRetrievalTraceInspector", () => {
  it("rejects blank workspace without calling the API", async () => {
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    await inspector.reload("   ");
    expect(inspector.error.value).toContain("workspace_root");
    expect(tracesApi.listRetrievalTraces).not.toHaveBeenCalled();
  });

  it("populates summaries after reload", async () => {
    tracesApi.listRetrievalTraces.mockResolvedValue(sampleListResponse);
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    await inspector.reload("/tmp/ws");
    expect(inspector.summaries.value).toHaveLength(1);
    expect(inspector.summaries.value[0].trace_id).toBe("trace-a");
  });

  it("loads detail on open()", async () => {
    tracesApi.listRetrievalTraces.mockResolvedValue(sampleListResponse);
    tracesApi.getRetrievalTrace.mockResolvedValue(sampleDetail);
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    await inspector.reload("/tmp/ws");
    await inspector.open("/tmp/ws", "trace-a");
    expect(inspector.selected.value?.stages).toHaveLength(2);
    expect(inspector.selected.value?.stages[0].name).toBe("base_search");
  });

  it("closeSelected clears the detail without touching the list", async () => {
    tracesApi.listRetrievalTraces.mockResolvedValue(sampleListResponse);
    tracesApi.getRetrievalTrace.mockResolvedValue(sampleDetail);
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    await inspector.reload("/tmp/ws");
    await inspector.open("/tmp/ws", "trace-a");
    inspector.closeSelected();
    expect(inspector.selected.value).toBeNull();
    expect(inspector.summaries.value).toHaveLength(1);
  });

  it("API failure flows into error ref and clears state", async () => {
    tracesApi.listRetrievalTraces.mockRejectedValue(new Error("network down"));
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    await inspector.reload("/tmp/ws");
    expect(inspector.summaries.value).toHaveLength(0);
    expect(inspector.error.value).toBe("network down");
  });

  it("asGoldenJsonl emits positive kind for ok verdict", async () => {
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    const line = inspector.asGoldenJsonl(sampleDetail);
    const parsed = JSON.parse(line);
    expect(parsed.kind).toBe("positive");
    expect(parsed.expected_chunk_ids).toEqual(["architecture#memory"]);
    expect(parsed.query).toBe("where is state");
  });

  it("asGoldenJsonl emits adversarial kind when verdict is empty", async () => {
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    const line = inspector.asGoldenJsonl({
      ...sampleDetail,
      final_verdict: "empty",
      final_candidate_ids: [],
    });
    const parsed = JSON.parse(line);
    expect(parsed.kind).toBe("adversarial");
    expect(parsed.expected_chunk_ids).toEqual([]);
  });

  it("asGoldenJsonl returns empty string when detail is null", async () => {
    const { useRetrievalTraceInspector } = await import("./useRetrievalTraceInspector");
    const inspector = useRetrievalTraceInspector();
    expect(inspector.asGoldenJsonl(null)).toBe("");
  });
});
