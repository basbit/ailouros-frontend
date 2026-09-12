import { describe, expect, it, vi } from "vitest";

const httpGetMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/http", () => ({ httpGet: httpGetMock }));

import { listUiModels } from "@/shared/api/endpoints/ui-models";

describe("listUiModels", () => {
  it("calls GET /v1/ui/models with the provider as an encoded query parameter", async () => {
    httpGetMock.mockResolvedValue({ models: [{ id: "qwen2.5:14b" }] });

    const result = await listUiModels("lm studio");

    expect(httpGetMock).toHaveBeenCalledWith("/v1/ui/models?provider=lm%20studio");
    expect(result.models).toEqual([{ id: "qwen2.5:14b" }]);
  });

  it("normalises a payload without a models list to an empty array", async () => {
    httpGetMock.mockResolvedValue({ error: "provider unavailable" });

    const result = await listUiModels("ollama");

    expect(result.models).toEqual([]);
    expect(result.error).toBe("provider unavailable");
  });

  it("normalises a non-object payload to an empty model list", async () => {
    httpGetMock.mockResolvedValue(null);

    const result = await listUiModels("ollama");

    expect(result.models).toEqual([]);
    expect(result.error).toBeUndefined();
  });
});
