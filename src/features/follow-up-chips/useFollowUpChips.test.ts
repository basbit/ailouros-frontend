import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FollowUpSuggestion } from "@/entities/follow-up";

import { resetFollowUpChips, useFollowUpChips } from "./useFollowUpChips";

const generateMock =
  vi.fn<
    (input: {
      query: string;
      answer?: string;
      contexts?: string[];
    }) => Promise<FollowUpSuggestion[]>
  >();

const statusMock = vi.fn<() => Promise<{ enabled: boolean; count: number }>>();

vi.mock("@/shared/api/endpoints/follow-up", () => ({
  generateFollowUps: (input: { query: string; answer?: string; contexts?: string[] }) =>
    generateMock(input),
  getFollowUpStatus: () => statusMock(),
}));

describe("useFollowUpChips", () => {
  beforeEach(() => {
    resetFollowUpChips();
    generateMock.mockReset();
    statusMock.mockReset();
  });

  it("ensureStatus caches the result and only fetches once per session", async () => {
    statusMock.mockResolvedValue({ enabled: true, count: 3 });
    const chips = useFollowUpChips();
    await chips.ensureStatus();
    await chips.ensureStatus();
    expect(statusMock).toHaveBeenCalledTimes(1);
    expect(chips.status.value).toEqual({ enabled: true, count: 3 });
  });

  it("ensureStatus falls back to disabled when the request fails", async () => {
    statusMock.mockRejectedValue(new Error("network down"));
    const chips = useFollowUpChips();
    const result = await chips.ensureStatus();
    expect(result).toEqual({ enabled: false, count: 0 });
    expect(chips.lastError.value).toBe("network down");
  });

  it("generate populates suggestions and toggles loading", async () => {
    let resolveLater: ((value: FollowUpSuggestion[]) => void) | null = null;
    generateMock.mockReturnValue(
      new Promise<FollowUpSuggestion[]>((res) => {
        resolveLater = res;
      }),
    );
    const chips = useFollowUpChips();
    const promise = chips.generate({ query: "hello" });
    expect(chips.loading.value).toBe(true);
    resolveLater!([
      { text: "First follow-up", rank: 1 },
      { text: "Second", rank: 2 },
    ]);
    await promise;
    expect(chips.loading.value).toBe(false);
    expect(chips.suggestions.value).toHaveLength(2);
    expect(chips.lastQuery.value).toBe("hello");
  });

  it("generate trims whitespace and short-circuits empty input", async () => {
    const chips = useFollowUpChips();
    await chips.generate({ query: "   " });
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("generate records the error and clears suggestions on failure", async () => {
    generateMock.mockRejectedValue(new Error("503 Service Unavailable"));
    const chips = useFollowUpChips();
    await chips.generate({ query: "any" });
    expect(chips.suggestions.value).toEqual([]);
    expect(chips.lastError.value).toBe("503 Service Unavailable");
  });

  it("clear resets the suggestions / query / error state", async () => {
    generateMock.mockResolvedValue([{ text: "x", rank: 1 }]);
    const chips = useFollowUpChips();
    await chips.generate({ query: "hello" });
    chips.clear();
    expect(chips.suggestions.value).toEqual([]);
    expect(chips.lastQuery.value).toBe("");
  });
});
