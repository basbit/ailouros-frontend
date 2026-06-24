import { describe, it, expect, vi, beforeEach } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn(),
  httpPut: vi.fn(),
  httpDelete: vi.fn(),
}));
vi.mock("@/shared/api/http", () => http);

import { listSecretNames, saveSecret, deleteSecret } from "./secrets";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("secrets endpoints", () => {
  it("listSecretNames returns the names array", async () => {
    http.httpGet.mockResolvedValue({ names: ["TAVILY_API_KEY", "EXA_API_KEY"] });
    expect(await listSecretNames()).toEqual(["TAVILY_API_KEY", "EXA_API_KEY"]);
    expect(http.httpGet).toHaveBeenCalledWith("/v1/secrets");
  });

  it("listSecretNames returns [] when the names field is missing", async () => {
    http.httpGet.mockResolvedValue({});
    expect(await listSecretNames()).toEqual([]);
  });

  it("saveSecret PUTs the name and value", async () => {
    http.httpPut.mockResolvedValue({});
    await saveSecret("TAVILY_API_KEY", "abc");
    expect(http.httpPut).toHaveBeenCalledWith("/v1/secrets", {
      name: "TAVILY_API_KEY",
      value: "abc",
    });
  });

  it("deleteSecret DELETEs the url-encoded name", async () => {
    http.httpDelete.mockResolvedValue({});
    await deleteSecret("A B");
    expect(http.httpDelete).toHaveBeenCalledWith("/v1/secrets/A%20B");
  });
});
