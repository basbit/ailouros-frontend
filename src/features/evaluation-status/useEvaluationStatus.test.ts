import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EvaluationStatus } from "@/shared/model/evaluation-status-types";
import { resetEvaluationStatus, useEvaluationStatus } from "./useEvaluationStatus";

const fetchMock = vi.fn<() => Promise<EvaluationStatus>>();

vi.mock("@/shared/api/endpoints/evaluation-status", () => ({
  getEvaluationStatus: () => fetchMock(),
}));

function makeStatus(overrides: Partial<EvaluationStatus> = {}): EvaluationStatus {
  return {
    ragas: { enabled: false, judgeKind: "heuristic" },
    telemetry: {
      enabled: false,
      exporterKind: "noop",
      readiness: { exporting: false, reason: "" },
    },
    entailment: {
      enabled: false,
      judgeKind: "heuristic",
      threshold: 0,
    },
    ...overrides,
  };
}

describe("useEvaluationStatus", () => {
  beforeEach(() => {
    resetEvaluationStatus();
    fetchMock.mockReset();
  });

  it("populates the status after refresh", async () => {
    fetchMock.mockResolvedValue(
      makeStatus({ ragas: { enabled: true, judgeKind: "heuristic" } }),
    );
    const composable = useEvaluationStatus();
    await composable.refresh();
    expect(composable.status.value?.ragas.enabled).toBe(true);
    expect(composable.visible.value).toBe(true);
  });

  it("dedupes refreshes already in flight", async () => {
    let resolveSlow: ((value: EvaluationStatus) => void) | null = null;
    fetchMock.mockReturnValue(
      new Promise<EvaluationStatus>((res) => {
        resolveSlow = res;
      }),
    );
    const composable = useEvaluationStatus();
    const first = composable.refresh();
    void composable.refresh();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveSlow!(makeStatus());
    await first;
  });

  it("records the error message when the endpoint throws", async () => {
    fetchMock.mockRejectedValue(new Error("500 down"));
    const composable = useEvaluationStatus();
    await composable.refresh();
    expect(composable.status.value).toBeNull();
    expect(composable.lastError.value).toBe("500 down");
  });

  it("clear empties the stored status", async () => {
    fetchMock.mockResolvedValue(makeStatus());
    const composable = useEvaluationStatus();
    await composable.refresh();
    composable.clear();
    expect(composable.status.value).toBeNull();
  });
});
