import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";

import type { SpecValidationResult } from "./spec-types";

const http = vi.hoisted(() => ({
  httpGet: vi.fn<(path: string) => Promise<unknown>>(),
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
    http.httpGet.mockReset();
  });

  it("hydrates result on success", async () => {
    const payload: SpecValidationResult = {
      ok: true,
      findings: [{ code: "I-1", severity: "info", message: "looks good" }],
    };
    http.httpGet.mockResolvedValue(payload);
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-1");
    expect(http.httpGet).toHaveBeenCalledWith("/v1/spec/spec-1/validate");
    expect(state.result.value).toEqual(payload);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("flips notImplemented on 404", async () => {
    http.httpGet.mockRejectedValue(new http.ApiError("HTTP 404", 404));
    const { useSpecValidation } = await import("./useSpecValidation");
    const state = useSpecValidation();
    await state.load("spec-x");
    expect(state.notImplemented.value).toBe(true);
    expect(state.error.value).toBeNull();
    expect(state.result.value).toBeNull();
  });

  it("surfaces other errors as an error message", async () => {
    http.httpGet.mockRejectedValue(new Error("boom"));
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
    expect(http.httpGet).not.toHaveBeenCalled();
  });

  it("reset clears state", async () => {
    http.httpGet.mockResolvedValue({ ok: true, findings: [] });
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
