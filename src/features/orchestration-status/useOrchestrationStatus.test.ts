import { beforeEach, describe, expect, it, vi } from "vitest";

import type { OrchestrationStatusSnapshot } from "@/shared/model/orchestration-status-types";

import {
  resetOrchestrationStatus,
  useOrchestrationStatus,
} from "./useOrchestrationStatus";

const fetchMock =
  vi.fn<
    (input: {
      scenario: string;
      workspaceRoot: string | null;
    }) => Promise<OrchestrationStatusSnapshot>
  >();

vi.mock("@/shared/api/endpoints/orchestration-status", () => ({
  getOrchestrationStatus: (input: { scenario: string; workspaceRoot: string | null }) =>
    fetchMock(input),
}));

function buildSnapshot(
  overrides: Partial<OrchestrationStatusSnapshot> = {},
): OrchestrationStatusSnapshot {
  return {
    scenario: "default",
    phase: {
      currentPhase: "execute",
      autoAdvanceAllowed: true,
      isTerminal: false,
      historySteps: 1,
    },
    hierarchy: {
      milestoneId: "",
      milestoneTitle: "",
      planCount: 0,
      waveCount: 0,
      taskCount: 0,
      pendingTasks: 0,
      completedTasks: 0,
      blockedTasks: 0,
    },
    artefacts: {
      scenario: "default",
      required: [],
      missing: [],
      empty: [],
      uncategorised: [],
      isComplete: true,
    },
    lint: {
      enabled: false,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      blockingCount: 0,
    },
    notes: [],
    ...overrides,
  };
}

describe("useOrchestrationStatus", () => {
  beforeEach(() => {
    resetOrchestrationStatus();
    fetchMock.mockReset();
  });

  it("starts with no snapshot and no error", () => {
    const status = useOrchestrationStatus();
    expect(status.snapshot.value).toBeNull();
    expect(status.lastError.value).toBeNull();
    expect(status.visible.value).toBe(false);
  });

  it("refresh populates the snapshot and marks visible", async () => {
    fetchMock.mockResolvedValue(buildSnapshot());
    const status = useOrchestrationStatus();
    await status.refresh({ scenario: "default" });
    expect(status.snapshot.value?.scenario).toBe("default");
    expect(status.visible.value).toBe(true);
    expect(status.lastFetchedAt.value).toBeTypeOf("number");
  });

  it("refresh trims scenario and ignores blank input without a network call", async () => {
    const status = useOrchestrationStatus();
    await status.refresh({ scenario: "   " });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(status.snapshot.value).toBeNull();
  });

  it("refresh records the error message when the request fails", async () => {
    fetchMock.mockRejectedValue(new Error("503 Service Unavailable"));
    const status = useOrchestrationStatus();
    await status.refresh({ scenario: "default" });
    expect(status.lastError.value).toBe("503 Service Unavailable");
    expect(status.snapshot.value).toBeNull();
  });

  it("refresh toggles the loading flag", async () => {
    let resolveLater: ((value: OrchestrationStatusSnapshot) => void) | null = null;
    fetchMock.mockReturnValue(
      new Promise<OrchestrationStatusSnapshot>((res) => {
        resolveLater = res;
      }),
    );
    const status = useOrchestrationStatus();
    const requestPromise = status.refresh({ scenario: "default" });
    expect(status.loading.value).toBe(true);
    resolveLater!(buildSnapshot());
    await requestPromise;
    expect(status.loading.value).toBe(false);
  });

  it("clear resets the composable", async () => {
    fetchMock.mockResolvedValue(buildSnapshot());
    const status = useOrchestrationStatus();
    await status.refresh({ scenario: "default" });
    status.clear();
    expect(status.snapshot.value).toBeNull();
    expect(status.lastFetchedAt.value).toBeNull();
  });
});
