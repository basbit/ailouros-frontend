import { describe, it, expect, vi, beforeEach } from "vitest";
import { computed } from "vue";

vi.mock("@/shared/api/endpoints/tasks", () => ({
  getLegacyTaskSnapshot: vi.fn(),
}));

vi.mock("@/features/swarm-run", () => ({
  useInjectedSwarmRunController: () => ({ isRunning: computed(() => false) }),
}));

import { getLegacyTaskSnapshot } from "@/shared/api/endpoints/tasks";
import { useUiStore } from "@/shared/store/ui";
import { useTurnPipelineSummary } from "./useTurnPipelineSummary";
import type { TurnPipelineSummary } from "@/entities/pipeline-progress";

const snapshotMock = vi.mocked(getLegacyTaskSnapshot);

function makeHistorySummary(
  history: unknown,
  steps: string[],
  failedStep = "",
): TurnPipelineSummary {
  snapshotMock.mockResolvedValue({
    status: "completed",
    history: history as never,
    pipeline_steps: steps,
    failed_step: failedStep,
  });
  return useTurnPipelineSummary({
    taskId: () => "task-hist",
    isLive: () => false,
  });
}

async function flushSnapshot(): Promise<void> {
  // The composable loads the snapshot from an immediate watcher; give the
  // microtask queue (and the async fetch) two ticks to settle.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("useTurnPipelineSummary", () => {
  beforeEach(() => {
    snapshotMock.mockReset();
  });

  it("live path: derives the latest log from the shared ui-store", async () => {
    const ui = useUiStore();
    ui.taskHistory = [
      { agent: "pm", message: "planning", status: "completed", timestamp: "t1" },
      { agent: "dev", message: "writing code", status: "in_progress", timestamp: "t2" },
    ] as typeof ui.taskHistory;
    // The live summary reads controller.isRunning, which the mock pins to
    // false; run-state liveness itself is covered by useRunLiveSteps tests.
    const summary = useTurnPipelineSummary({
      taskId: () => "task-live",
      isLive: () => true,
    });
    await flushSnapshot();

    expect(snapshotMock).not.toHaveBeenCalled();
    expect(summary.latestLog.value).toBe("dev: writing code");
    expect(summary.logLines.value.length).toBe(2);
  });

  it("history path: loads snapshot and derives completed steps", async () => {
    const summary = makeHistorySummary(
      [
        { agent: "pm", message: "spec", status: "completed", timestamp: "t1" },
        { agent: "dev", message: "code", status: "completed", timestamp: "t2" },
        { agent: "qa", message: "verdict", status: "completed", timestamp: "t3" },
      ],
      ["pm", "dev", "qa"],
    );
    await flushSnapshot();

    expect(summary.totalSteps.value).toBe(3);
    expect(summary.completedCount.value).toBe(3);
    expect(summary.progressPct.value).toBe(100);
    expect(summary.isRunning.value).toBe(false);
  });

  it("history path: a failed step keeps the run from reading as 100% green", async () => {
    const summary = makeHistorySummary(
      [
        { agent: "pm", message: "spec", status: "completed", timestamp: "t1" },
        { agent: "dev", message: "boom", status: "failed", timestamp: "t2" },
      ],
      ["pm", "dev", "qa"],
      "dev",
    );
    await flushSnapshot();

    expect(summary.failedCount.value).toBeGreaterThanOrEqual(1);
    expect(summary.progressPct.value).toBeLessThan(100);
  });
});
