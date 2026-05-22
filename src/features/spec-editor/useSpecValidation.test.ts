import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body?: string;
    constructor(message: string, status: number, body?: string) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  }
  return {
    ApiError,
    httpPost: vi.fn<(url: string, body: unknown) => Promise<unknown>>(),
  };
});

vi.mock("@/shared/api/http", () => http);

afterEach(() => {
  vi.clearAllMocks();
});

const successPayload = {
  spec_id: "core",
  ok: true,
  issues: [],
};

describe("useSpecValidation.load — happy path", () => {
  beforeEach(() => {
    http.httpPost.mockReset();
  });

  it("stores result and clears flags on success", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.result.value).toEqual(successPayload);
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("URL-encodes specId in the endpoint path", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("space id/with-slash");
    expect(http.httpPost).toHaveBeenCalledWith(
      "/v1/spec/space%20id%2Fwith-slash/validate",
      expect.any(Object),
    );
  });

  it("includes workspace_root in payload when provided", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core", "/workspaces/repo");
    expect(http.httpPost).toHaveBeenCalledWith(expect.any(String), {
      workspace_root: "/workspaces/repo",
    });
  });

  it("sends empty payload when workspaceRoot is null", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core", null);
    expect(http.httpPost).toHaveBeenCalledWith(expect.any(String), {});
  });

  it("sends empty payload when workspaceRoot is omitted", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(http.httpPost).toHaveBeenCalledWith(expect.any(String), {});
  });

  it("sends empty payload when workspaceRoot is empty string", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core", "");
    expect(http.httpPost).toHaveBeenCalledWith(expect.any(String), {});
  });

  it("flips loading flag during the call and back when settled", async () => {
    let resolveCall: ((value: unknown) => void) | null = null;
    http.httpPost.mockReturnValue(
      new Promise((resolve) => {
        resolveCall = resolve;
      }),
    );
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    const promise = state.load("core");
    expect(state.loading.value).toBe(true);
    resolveCall!(successPayload);
    await promise;
    expect(state.loading.value).toBe(false);
  });
});

describe("useSpecValidation.load — input validation", () => {
  it("returns early without IPC when specId is empty", async () => {
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("");
    expect(http.httpPost).not.toHaveBeenCalled();
    expect(state.loading.value).toBe(false);
  });
});

describe("useSpecValidation.load — error handling", () => {
  beforeEach(() => {
    http.httpPost.mockReset();
  });

  it("sets notImplemented and clears result on ApiError 404", async () => {
    http.httpPost.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation({ ok: true, findings: [] });
    await state.load("core");
    expect(state.notImplemented.value).toBe(true);
    expect(state.result.value).toBeNull();
    expect(state.error.value).toBeNull();
  });

  it("sets notImplemented on non-ApiError object with status=404 property", async () => {
    http.httpPost.mockRejectedValue({ status: 404 });
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.notImplemented.value).toBe(true);
    expect(state.result.value).toBeNull();
  });

  it("surfaces ApiError message for non-404 statuses", async () => {
    http.httpPost.mockRejectedValue(new http.ApiError("HTTP 500: down", 500));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBe("HTTP 500: down");
  });

  it("surfaces plain Error.message", async () => {
    http.httpPost.mockRejectedValue(new Error("network outage"));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.error.value).toBe("network outage");
  });

  it("uses generic message when thrown value is not an Error and not a 404 object", async () => {
    http.httpPost.mockRejectedValue("just a string");
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.error.value).toBe("Failed to load validation result.");
  });

  it("clears loading flag in finally block on error", async () => {
    http.httpPost.mockRejectedValue(new Error("boom"));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    expect(state.loading.value).toBe(false);
  });

  it("clears previous error before each new load", async () => {
    http.httpPost.mockResolvedValueOnce(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    state.error.value = "previous";
    await state.load("core");
    expect(state.error.value).toBeNull();
  });

  it("clears previous notImplemented before each new load", async () => {
    http.httpPost.mockResolvedValueOnce(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    state.notImplemented.value = true;
    await state.load("core");
    expect(state.notImplemented.value).toBe(false);
  });
});

describe("useSpecValidation.reset and initial state", () => {
  beforeEach(() => {
    http.httpPost.mockReset();
  });

  it("preserves initial value passed to factory", async () => {
    const initial = {
      ok: false,
      findings: [{ code: "X", severity: "error" as const, message: "x" }],
    };
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation(initial);
    expect(state.result.value).toEqual(initial);
  });

  it("starts with null result when no initial is provided", async () => {
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    expect(state.result.value).toBeNull();
  });

  it("reset clears every field back to initial state", async () => {
    http.httpPost.mockResolvedValue(successPayload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("core");
    state.error.value = "x";
    state.notImplemented.value = true;
    state.loading.value = true;
    state.reset();
    expect(state.result.value).toBeNull();
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});
