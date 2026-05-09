import { describe, expect, it, vi } from "vitest";
import {
  detectLocalLlmProviders,
  recommendOnboardingPath,
} from "@/shared/lib/local-llm-detect";

function buildFetchStub(routes: Record<string, number>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const status = routes[url] ?? 0;
    if (status === 0) {
      throw new Error(`network error for ${url}`);
    }
    return new Response(null, { status });
  }) as unknown as typeof fetch;
}

describe("detectLocalLlmProviders", () => {
  it("returns both flags true when each endpoint responds 200", async () => {
    const fetcher = buildFetchStub({
      "http://localhost:11434/api/tags": 200,
      "http://localhost:1234/v1/models": 200,
    });

    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });

    expect(result.ollama).toBe(true);
    expect(result.lmStudio).toBe(true);
  });

  it("returns false when endpoint refuses connection", async () => {
    const fetcher = buildFetchStub({});

    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 50 });

    expect(result.ollama).toBe(false);
    expect(result.lmStudio).toBe(false);
  });

  it("respects custom base URLs", async () => {
    const fetcher = buildFetchStub({
      "http://example.test:11434/api/tags": 200,
      "http://other.test:1234/v1/models": 200,
    });

    const result = await detectLocalLlmProviders({
      fetcher,
      timeoutMs: 100,
      ollamaBaseUrl: "http://example.test:11434",
      lmStudioBaseUrl: "http://other.test:1234",
    });

    expect(result.ollama).toBe(true);
    expect(result.lmStudio).toBe(true);
    expect(result.ollamaBaseUrl).toBe("http://example.test:11434");
    expect(result.lmStudioBaseUrl).toBe("http://other.test:1234");
  });

  it("returns false on non-2xx status", async () => {
    const fetcher = buildFetchStub({
      "http://localhost:11434/api/tags": 500,
      "http://localhost:1234/v1/models": 404,
    });

    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });

    expect(result.ollama).toBe(false);
    expect(result.lmStudio).toBe(false);
  });
});

describe("recommendOnboardingPath", () => {
  it("recommends local-server when Ollama detected", () => {
    expect(
      recommendOnboardingPath({
        ollama: true,
        lmStudio: false,
        ollamaBaseUrl: "",
        lmStudioBaseUrl: "",
      }),
    ).toBe("use-local-server");
  });

  it("recommends local-server when LM Studio detected", () => {
    expect(
      recommendOnboardingPath({
        ollama: false,
        lmStudio: true,
        ollamaBaseUrl: "",
        lmStudioBaseUrl: "",
      }),
    ).toBe("use-local-server");
  });

  it("recommends downloading default GGUF when nothing detected", () => {
    expect(
      recommendOnboardingPath({
        ollama: false,
        lmStudio: false,
        ollamaBaseUrl: "",
        lmStudioBaseUrl: "",
      }),
    ).toBe("download-default-gguf");
  });
});
