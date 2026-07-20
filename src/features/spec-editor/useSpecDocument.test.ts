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

describe("useSpecDocument", () => {
  beforeEach(() => {
    http.httpGet.mockReset();
  });

  it("loads the doc body from /v1/spec/document when a node id is selected", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "step:pm",
      agent: "pm",
      step_id: "pm",
      version: 15,
      path: "pm/pm.md",
      depends_on: [],
      produces: [],
      body: "\n# PM\n\nRequirements go here.",
    });

    const { useSpecDocument } = await import("./useSpecDocument");
    const state = useSpecDocument();
    await state.load("step:pm", "/workspace");

    expect(http.httpGet).toHaveBeenCalledWith(
      "/v1/spec/document?workspace_root=%2Fworkspace&spec_id=step%3Apm",
    );
    expect(state.document.value?.spec_id).toBe("step:pm");
    expect(state.document.value?.title).toBe("step:pm");
    expect(state.document.value?.status).toBe("pm");
    expect(state.document.value?.version).toBe("15");
    expect(state.document.value?.body).toContain("Requirements go here.");
    expect(state.error.value).toBeNull();
    expect(state.notFound.value).toBe(false);
  });

  it("does not fetch when spec id or workspace root is blank", async () => {
    const { useSpecDocument } = await import("./useSpecDocument");
    const state = useSpecDocument();
    await state.load("", "/workspace");
    await state.load("spec:auth", "");
    expect(http.httpGet).not.toHaveBeenCalled();
    expect(state.document.value).toBeNull();
  });

  it("flips notFound on a 404 and clears the document", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecDocument } = await import("./useSpecDocument");
    const state = useSpecDocument();
    await state.load("spec:missing", "/workspace");
    expect(state.notFound.value).toBe(true);
    expect(state.document.value).toBeNull();
    expect(state.error.value).toBeNull();
  });

  it("surfaces non-404 failures in error", async () => {
    http.httpGet.mockRejectedValue(new Error("network down"));
    const { useSpecDocument } = await import("./useSpecDocument");
    const state = useSpecDocument();
    await state.load("spec:auth", "/workspace");
    expect(state.error.value).toBe("network down");
    expect(state.notFound.value).toBe(false);
  });

  it("reset clears all reactive state", async () => {
    http.httpGet.mockResolvedValue({
      spec_id: "step:pm",
      agent: "pm",
      version: 1,
      body: "x",
    });
    const { useSpecDocument } = await import("./useSpecDocument");
    const state = useSpecDocument();
    await state.load("spec:1", "/workspace");
    expect(state.document.value).not.toBeNull();
    state.reset();
    expect(state.document.value).toBeNull();
    expect(state.error.value).toBeNull();
    expect(state.notFound.value).toBe(false);
  });
});
