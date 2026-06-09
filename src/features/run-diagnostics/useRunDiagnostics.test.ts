import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RunDiagnostics } from "@/entities/run-diagnostics";
import { resetRunDiagnostics, useRunDiagnostics } from "./useRunDiagnostics";

const fetchMock = vi.fn();

vi.mock("@/shared/api/endpoints/run-diagnostics", () => ({
  getRunDiagnostics: (input: unknown) => fetchMock(input),
}));

function makeDiagnostics(): RunDiagnostics {
  return {
    taskId: "t-1",
    phaseLoop: null,
    wikiContextTier: null,
    entailmentVerdict: null,
    citation: null,
    postPipelineGates: null,
    flareSignal: null,
    enableHints: {},
  };
}

describe("useRunDiagnostics", () => {
  beforeEach(() => {
    resetRunDiagnostics();
    fetchMock.mockReset();
  });

  it("skips refresh when taskId blank", async () => {
    const composable = useRunDiagnostics();
    await composable.refresh({ taskId: "  ", workspaceRoot: "/x" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips refresh when workspace blank", async () => {
    const composable = useRunDiagnostics();
    await composable.refresh({ taskId: "t", workspaceRoot: "  " });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores diagnostics on success", async () => {
    fetchMock.mockResolvedValue(makeDiagnostics());
    const composable = useRunDiagnostics();
    await composable.refresh({ taskId: "t-1", workspaceRoot: "/tmp" });
    expect(composable.diagnostics.value?.taskId).toBe("t-1");
    expect(composable.visible.value).toBe(true);
  });

  it("captures errors", async () => {
    fetchMock.mockRejectedValue(new Error("500 boom"));
    const composable = useRunDiagnostics();
    await composable.refresh({ taskId: "t", workspaceRoot: "/tmp" });
    expect(composable.lastError.value).toBe("500 boom");
  });
});
