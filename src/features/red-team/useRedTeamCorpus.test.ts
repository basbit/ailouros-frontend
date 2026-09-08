import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RedTeamCorpus } from "@/shared/model/red-team-types";
import { resetRedTeamCorpus, useRedTeamCorpus } from "./useRedTeamCorpus";

const fetchMock = vi.fn<() => Promise<RedTeamCorpus>>();

vi.mock("@/shared/api/endpoints/red-team", () => ({
  getRedTeamCorpus: () => fetchMock(),
}));

function makeCorpus(overrides: Partial<RedTeamCorpus> = {}): RedTeamCorpus {
  return {
    count: 1,
    probes: [
      {
        probeId: "PI-001",
        category: "prompt_injection",
        inputText: "...",
        description: "",
      },
    ],
    ...overrides,
  };
}

describe("useRedTeamCorpus", () => {
  beforeEach(() => {
    resetRedTeamCorpus();
    fetchMock.mockReset();
  });

  it("populates the corpus after refresh", async () => {
    fetchMock.mockResolvedValue(makeCorpus({ count: 3 }));
    const composable = useRedTeamCorpus();
    await composable.refresh();
    expect(composable.corpus.value?.count).toBe(3);
    expect(composable.visible.value).toBe(true);
  });

  it("dedupes a refresh already in flight", async () => {
    let resolveSlow: ((value: RedTeamCorpus) => void) | null = null;
    fetchMock.mockReturnValue(
      new Promise<RedTeamCorpus>((res) => {
        resolveSlow = res;
      }),
    );
    const composable = useRedTeamCorpus();
    const first = composable.refresh();
    void composable.refresh();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveSlow!(makeCorpus());
    await first;
  });

  it("records error when endpoint throws", async () => {
    fetchMock.mockRejectedValue(new Error("500 disabled"));
    const composable = useRedTeamCorpus();
    await composable.refresh();
    expect(composable.corpus.value).toBeNull();
    expect(composable.lastError.value).toBe("500 disabled");
  });

  it("clear empties the cached corpus", async () => {
    fetchMock.mockResolvedValue(makeCorpus());
    const composable = useRedTeamCorpus();
    await composable.refresh();
    composable.clear();
    expect(composable.corpus.value).toBeNull();
  });
});
