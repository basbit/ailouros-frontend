import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import type { SpecValidationResult } from "./spec-types";

const http = vi.hoisted(() => ({
  httpPost: vi.fn<(path: string, body?: unknown) => Promise<unknown>>(),
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

describe("SpecValidator rendering", () => {
  it("renders provided initial findings", async () => {
    const { default: SpecValidator } = await import("./SpecValidator.vue");
    const initial: SpecValidationResult = {
      ok: false,
      findings: [
        { code: "C-1", severity: "error", message: "broken", refs: ["REQ-1"] },
      ],
    };
    const wrapper = mount(SpecValidator, {
      props: { specId: "x", initial, autoFetch: false },
    });
    expect(wrapper.text()).toContain("broken");
    expect(wrapper.text()).toContain("issues");
  });

  it("renders ok badge when findings list is empty", async () => {
    const { default: SpecValidator } = await import("./SpecValidator.vue");
    const wrapper = mount(SpecValidator, {
      props: {
        specId: "x",
        initial: { ok: true, findings: [] },
        autoFetch: false,
      },
    });
    expect(wrapper.text()).toContain("ok");
    expect(wrapper.text()).toContain("No findings.");
  });

  it("shows empty hint when no initial result and autoFetch is false", async () => {
    const { default: SpecValidator } = await import("./SpecValidator.vue");
    const wrapper = mount(SpecValidator, {
      props: { specId: "x", autoFetch: false },
    });
    expect(wrapper.text()).toContain("No validation result yet.");
  });
});

describe("useSpecValidation composable", () => {
  beforeEach(() => {
    http.httpPost.mockReset();
  });

  it("hydrates result on success", async () => {
    const payload: SpecValidationResult = {
      ok: true,
      findings: [{ code: "I-1", severity: "info", message: "looks good" }],
    };
    http.httpPost.mockResolvedValue(payload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-1", "/tmp/ws");
    expect(http.httpPost).toHaveBeenCalledWith("/v1/spec/spec-1/validate", {
      workspace_root: "/tmp/ws",
    });
    expect(state.result.value).toEqual(payload);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("omits workspace_root from payload when not provided", async () => {
    http.httpPost.mockResolvedValue({ ok: true, findings: [] });
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-1");
    expect(http.httpPost).toHaveBeenCalledWith("/v1/spec/spec-1/validate", {});
  });

  it("flips notImplemented on 404", async () => {
    http.httpPost.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-x");
    expect(state.notImplemented.value).toBe(true);
    expect(state.error.value).toBeNull();
    expect(state.result.value).toBeNull();
  });

  it("surfaces other errors as an error message", async () => {
    http.httpPost.mockRejectedValue(new Error("boom"));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-x");
    expect(state.error.value).toBe("boom");
    expect(state.notImplemented.value).toBe(false);
  });

  it("ignores empty spec ids", async () => {
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("");
    expect(http.httpPost).not.toHaveBeenCalled();
  });

  it("reset clears state", async () => {
    http.httpPost.mockResolvedValue({ ok: true, findings: [] });
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-1");
    state.reset();
    expect(state.result.value).toBeNull();
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});
