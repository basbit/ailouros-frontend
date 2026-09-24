/**
 * The Agent models pane mounts a card per role, and every card asked for the
 * same catalog: 8× `GET /v1/ui/models?provider=ollama` and 17× the cloud
 * POST fired in parallel on load. One request per key, shared by all callers.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({
  httpGet: vi.fn(),
  httpPost: vi.fn(),
}));

vi.mock("@/shared/api/http", () => ({
  ApiError: class ApiError extends Error {},
  httpGet: http.httpGet,
  httpPost: http.httpPost,
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/shared/lib/use-swarm-defaults", () => ({
  defaultRemoteApiBaseUrl: () => "https://api.example.test",
}));

import {
  ensureModelChoicesForEnv,
  fetchCloudModelsFromConnection,
  resetModelListCache,
} from "./use-model-list";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe("model catalog — local providers", () => {
  beforeEach(() => {
    resetModelListCache();
    http.httpGet.mockReset();
  });

  it("eight concurrent callers for the same provider share one GET", async () => {
    const pending = deferred<{ models: { id: string }[] }>();
    http.httpGet.mockReturnValue(pending.promise);

    const calls = Array.from({ length: 8 }, () => ensureModelChoicesForEnv("ollama"));
    pending.resolve({ models: [{ id: "qwen3:8b" }] });
    const results = await Promise.all(calls);

    expect(http.httpGet).toHaveBeenCalledTimes(1);
    for (const pairs of results) {
      expect(pairs.map(([id]) => id)).toEqual(["qwen3:8b", "__custom__"]);
    }
  });

  it("serves later callers from the cache", async () => {
    http.httpGet.mockResolvedValue({ models: [{ id: "a" }] });
    await ensureModelChoicesForEnv("ollama");
    await ensureModelChoicesForEnv("ollama");
    expect(http.httpGet).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failure, so a retry hits the provider again", async () => {
    http.httpGet.mockRejectedValueOnce(new Error("down"));
    await expect(ensureModelChoicesForEnv("ollama")).rejects.toThrow();
    http.httpGet.mockResolvedValueOnce({ models: [{ id: "a" }] });
    await expect(ensureModelChoicesForEnv("ollama")).resolves.toHaveLength(2);
    expect(http.httpGet).toHaveBeenCalledTimes(2);
  });
});

describe("model catalog — cloud providers", () => {
  beforeEach(() => {
    resetModelListCache();
    http.httpPost.mockReset();
  });

  it("seventeen role cards with the same profile share one POST", async () => {
    const pending = deferred<{ ok: boolean; models: { id: string }[] }>();
    http.httpPost.mockReturnValue(pending.promise);
    const source = { provider: "ollama", base_url: "", api_key: "k" };

    const calls = Array.from({ length: 17 }, () => fetchCloudModelsFromConnection(source));
    pending.resolve({ ok: true, models: [{ id: "gpt-oss:120b" }] });
    await Promise.all(calls);

    expect(http.httpPost).toHaveBeenCalledTimes(1);
  });

  it("keys the cache by provider, base url and key — a different profile is a different request", async () => {
    http.httpPost.mockResolvedValue({ ok: true, models: [{ id: "m" }] });

    await fetchCloudModelsFromConnection({ provider: "ollama", base_url: "", api_key: "k1" });
    await fetchCloudModelsFromConnection({ provider: "ollama", base_url: "", api_key: "k2" });
    await fetchCloudModelsFromConnection({ provider: "ollama", base_url: "https://b", api_key: "k1" });
    await fetchCloudModelsFromConnection({ provider: "openai", base_url: "", api_key: "k1" });
    await fetchCloudModelsFromConnection({ provider: "ollama", base_url: "", api_key: "k1" });

    expect(http.httpPost).toHaveBeenCalledTimes(4);
  });
});
