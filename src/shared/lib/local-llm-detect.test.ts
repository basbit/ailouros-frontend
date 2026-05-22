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

describe("detectLocalLlmProviders — success paths", () => {
  it("returns both flags true when each endpoint responds 200", async () => {
    const fetcher = buildFetchStub({
      "http://localhost:11434/api/tags": 200,
      "http://localhost:1234/v1/models": 200,
    });
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });
    expect(result.ollama).toBe(true);
    expect(result.lmStudio).toBe(true);
  });

  it("hits exact endpoints '/api/tags' and '/v1/models'", async () => {
    const recordedUrls: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      recordedUrls.push(typeof input === "string" ? input : input.toString());
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });
    expect(recordedUrls).toContain("http://localhost:11434/api/tags");
    expect(recordedUrls).toContain("http://localhost:1234/v1/models");
  });

  it("uses GET method with no-store cache and abort signal", async () => {
    let capturedInit: RequestInit | undefined;
    const fetcher = vi.fn(async (_input, init: RequestInit) => {
      capturedInit = init;
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;
    await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });
    expect(capturedInit?.method).toBe("GET");
    expect(capturedInit?.cache).toBe("no-store");
    expect(capturedInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it("returns default base URLs when none are provided", async () => {
    const fetcher = buildFetchStub({});
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 50 });
    expect(result.ollamaBaseUrl).toBe("http://localhost:11434");
    expect(result.lmStudioBaseUrl).toBe("http://localhost:1234");
  });

  it("respects custom base URLs and echoes them back", async () => {
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

  it("uses globalThis.fetch when no fetcher option is provided", async () => {
    const originalFetch = globalThis.fetch;
    const stubbed = vi.fn(async () => new Response(null, { status: 200 }));
    globalThis.fetch = stubbed as unknown as typeof fetch;
    try {
      const result = await detectLocalLlmProviders({ timeoutMs: 100 });
      expect(result.ollama).toBe(true);
      expect(result.lmStudio).toBe(true);
      expect(stubbed).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("detectLocalLlmProviders — failure paths", () => {
  it("returns both flags false when endpoints refuse connection", async () => {
    const fetcher = buildFetchStub({});
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 50 });
    expect(result.ollama).toBe(false);
    expect(result.lmStudio).toBe(false);
  });

  it("returns false for non-2xx status codes", async () => {
    const fetcher = buildFetchStub({
      "http://localhost:11434/api/tags": 500,
      "http://localhost:1234/v1/models": 404,
    });
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });
    expect(result.ollama).toBe(false);
    expect(result.lmStudio).toBe(false);
  });

  it("treats one endpoint failure independently of the other", async () => {
    const fetcher = buildFetchStub({
      "http://localhost:11434/api/tags": 200,
      "http://localhost:1234/v1/models": 500,
    });
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 100 });
    expect(result.ollama).toBe(true);
    expect(result.lmStudio).toBe(false);
  });

  it("aborts the request when fetcher hangs past timeoutMs", async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetcher = vi.fn((_input, init: RequestInit) => {
      capturedSignal = init.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        capturedSignal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    }) as unknown as typeof fetch;
    const result = await detectLocalLlmProviders({ fetcher, timeoutMs: 5 });
    expect(result.ollama).toBe(false);
    expect(result.lmStudio).toBe(false);
  });

  it("uses default timeout 1500ms when not specified", async () => {
    const fetcher = vi.fn(
      async () => new Response(null, { status: 200 }),
    ) as unknown as typeof fetch;
    const result = await detectLocalLlmProviders({ fetcher });
    expect(result.ollama).toBe(true);
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

  it("recommends local-server when both are detected", () => {
    expect(
      recommendOnboardingPath({
        ollama: true,
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
