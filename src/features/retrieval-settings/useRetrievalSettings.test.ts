import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RetrievalSettings } from "@/entities/retrieval-settings";
import { resetRetrievalSettings, useRetrievalSettings } from "./useRetrievalSettings";

const fetchMock = vi.fn<() => Promise<RetrievalSettings>>();

vi.mock("@/shared/api/endpoints/retrieval-settings", () => ({
  getRetrievalSettings: () => fetchMock(),
}));

function makeSettings(overrides: Partial<RetrievalSettings> = {}): RetrievalSettings {
  return {
    wikiSearchEnabled: true,
    topK: 8,
    maxChars: 8000,
    minRelevance: 0.5,
    rerankModel: "",
    ...overrides,
  };
}

describe("useRetrievalSettings", () => {
  beforeEach(() => {
    resetRetrievalSettings();
    fetchMock.mockReset();
  });

  it("populates settings after refresh", async () => {
    fetchMock.mockResolvedValue(makeSettings());
    const composable = useRetrievalSettings();
    await composable.refresh();
    expect(composable.settings.value).not.toBeNull();
    expect(composable.visible.value).toBe(true);
  });

  it("dedupes refreshes while one is already in flight", async () => {
    let resolveSlow: ((value: RetrievalSettings) => void) | null = null;
    fetchMock.mockReturnValue(
      new Promise<RetrievalSettings>((res) => {
        resolveSlow = res;
      }),
    );
    const composable = useRetrievalSettings();
    const first = composable.refresh();
    void composable.refresh();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveSlow!(makeSettings());
    await first;
  });

  it("records the error message when the endpoint throws", async () => {
    fetchMock.mockRejectedValue(new Error("500 unreachable"));
    const composable = useRetrievalSettings();
    await composable.refresh();
    expect(composable.settings.value).toBeNull();
    expect(composable.lastError.value).toBe("500 unreachable");
  });

  it("clear empties the cached settings", async () => {
    fetchMock.mockResolvedValue(makeSettings());
    const composable = useRetrievalSettings();
    await composable.refresh();
    composable.clear();
    expect(composable.settings.value).toBeNull();
    expect(composable.visible.value).toBe(false);
  });
});
