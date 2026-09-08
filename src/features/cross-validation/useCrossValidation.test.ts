import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import type { RemoteProfileRow } from "@/shared/model/project-types";
import { useCrossValidation } from "./useCrossValidation";

const { fetchCloudModelsForProfileMock, ensureModelChoicesForEnvMock } = vi.hoisted(
  () => ({
    fetchCloudModelsForProfileMock: vi.fn(),
    ensureModelChoicesForEnvMock: vi.fn(),
  }),
);

vi.mock("@/shared/lib/use-model-list", () => ({
  fetchCloudModelsForProfile: fetchCloudModelsForProfileMock,
  ensureModelChoicesForEnv: ensureModelChoicesForEnvMock,
}));

const cloudProfile = {
  id: "anthropic",
  provider: "anthropic",
  api_key: "sk-test",
  base_url: "",
} as RemoteProfileRow;

describe("useCrossValidation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    ensureModelChoicesForEnvMock.mockResolvedValue([["qwen3:8b", "qwen3:8b"]]);
    fetchCloudModelsForProfileMock.mockResolvedValue([["claude-opus-5", "opus"]]);
  });

  function makeChain() {
    return useCrossValidation({ value: [cloudProfile] }, vi.fn());
  }

  it("sends nothing when no chain is configured, so scenario defaults survive", () => {
    expect(makeChain().collectForApi()).toBeNull();
  });

  it("a role-backed validator becomes model_from_role", () => {
    const chain = makeChain();
    chain.add({ source: "role", role: "pm" });

    expect(chain.collectForApi()).toEqual({
      validators: [{ model_from_role: "pm" }],
    });
  });

  it("an explicit cloud model carries its environment and profile", () => {
    const chain = makeChain();
    chain.add({
      source: "model",
      environment: "cloud",
      model: "claude-opus-5",
      remote_profile: "anthropic",
      prompt: "  find security holes  ",
      apply_edits: true,
    });

    expect(chain.collectForApi()).toEqual({
      validators: [
        {
          model: "claude-opus-5",
          environment: "cloud",
          remote_profile: "anthropic",
          prompt: "find security holes",
          apply_edits: true,
        },
      ],
    });
  });

  it("the same role can appear twice with different models", () => {
    const chain = makeChain();
    chain.add({ source: "model", environment: "ollama", model: "qwen3:8b" });
    chain.add({ source: "model", environment: "ollama", model: "llama3:70b" });

    const config = chain.collectForApi();
    expect(config?.validators.map((entry) => entry.model)).toEqual([
      "qwen3:8b",
      "llama3:70b",
    ]);
  });

  it("drops rows that name neither a role nor a model", () => {
    const chain = makeChain();
    chain.add({ source: "role", role: "pm" });
    chain.add({ source: "role", role: "" });
    chain.add({ source: "model", model: "   " });

    expect(chain.collectForApi()).toEqual({
      validators: [{ model_from_role: "pm" }],
    });
  });

  it("returns null when every configured row is unusable", () => {
    const chain = makeChain();
    chain.add({ source: "role", role: "" });

    expect(chain.collectForApi()).toBeNull();
  });

  it("move reorders the chain and keeps each row's model list with it", async () => {
    const chain = makeChain();
    chain.add({ source: "model", environment: "ollama", model: "a" });
    chain.add({
      source: "model",
      environment: "cloud",
      remote_profile: "anthropic",
      model: "b",
    });
    await vi.waitFor(() => expect(chain.uiStates[1].modelChoices.length).toBe(1));

    chain.move(1, -1);

    expect(chain.validators.value.map((row) => row.model)).toEqual(["b", "a"]);
    expect(chain.uiStates[0].modelChoices).toEqual([["claude-opus-5", "opus"]]);
  });

  it("move is a no-op at the edges", () => {
    const chain = makeChain();
    chain.add({ source: "role", role: "pm" });
    chain.add({ source: "role", role: "ba" });

    chain.move(0, -1);
    chain.move(1, 1);

    expect(chain.validators.value.map((row) => row.role)).toEqual(["pm", "ba"]);
  });

  it("a cloud row without a profile lists no models rather than a stale catalogue", async () => {
    const chain = makeChain();
    chain.add({ source: "model", environment: "cloud", remote_profile: "anthropic" });
    await vi.waitFor(() => expect(chain.uiStates[0].modelChoices.length).toBe(1));

    chain.update(0, "remote_profile", "");
    await vi.waitFor(() => expect(chain.uiStates[0].modelChoices).toEqual([]));
  });

  it("surfaces a model-list failure instead of silently offering an empty list", async () => {
    ensureModelChoicesForEnvMock.mockRejectedValue(new Error("ollama is down"));
    const chain = makeChain();
    chain.add({ source: "model", environment: "ollama" });

    await vi.waitFor(() =>
      expect(chain.uiStates[0].modelFetchError).toBe("ollama is down"),
    );
  });

  it("applySnap restores a persisted chain and fills in missing fields", () => {
    const chain = makeChain();

    chain.applySnap([{ source: "role", role: "architect" } as never]);

    expect(chain.validators.value[0]).toMatchObject({
      source: "role",
      role: "architect",
      prompt: "",
      apply_edits: false,
    });
    expect(chain.collectForApi()).toEqual({
      validators: [{ model_from_role: "architect" }],
    });
  });

  it("applySnap on an absent key clears the chain", () => {
    const chain = makeChain();
    chain.add({ source: "role", role: "pm" });

    chain.applySnap(undefined);

    expect(chain.validators.value).toEqual([]);
    expect(chain.uiStates).toEqual([]);
  });

  it("a slow stale model fetch does not clobber a newer one", async () => {
    // Deterministic: the first call hangs until we resolve it; the second
    // resolves immediately. The older resolver fires AFTER the newer one and
    // its result must be dropped by the epoch guard.
    const resolvers: { resolve: (v: [string, string][]) => void }[] = [];
    ensureModelChoicesForEnvMock.mockImplementation(
      () =>
        new Promise<[string, string][]>((resolve) => {
          resolvers.push({ resolve });
        }),
    );
    const chain = makeChain();
    chain.add({ source: "model", environment: "ollama", model: "a" });
    // add() triggered fetch #1 (hanging). Trigger a second, newer fetch.
    void chain.fetchModels(0);
    await vi.waitFor(() => expect(resolvers.length).toBe(2));

    // Newer fetch resolves first.
    resolvers[1].resolve([["llama3:70b", "llama"]]);
    await vi.waitFor(() =>
      expect(chain.uiStates[0].modelChoices).toEqual([["llama3:70b", "llama"]]),
    );

    // The stale first response lands and must be dropped.
    resolvers[0].resolve([["qwen3:8b", "qwen"]]);
    await vi.waitFor(() =>
      expect(chain.uiStates[0].modelChoices).toEqual([["llama3:70b", "llama"]]),
    );
  });
});
