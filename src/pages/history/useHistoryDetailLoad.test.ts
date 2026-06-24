import { describe, it, expect, vi, beforeEach } from "vitest";
import { computed, nextTick, ref } from "vue";

import { useHistoryDetailLoad } from "./useHistoryDetailLoad";
import type { HistoryEntry } from "@/shared/store/ui";

const getLegacyTaskSnapshot = vi.fn();

vi.mock("@/shared/api/endpoints/tasks", () => ({
  getLegacyTaskSnapshot: (taskId: string) => getLegacyTaskSnapshot(taskId),
}));

function makeEntry(taskId: string): HistoryEntry {
  return {
    id: "entry-1",
    taskId,
    prompt: "p",
    at: "2026-06-11T19:30:00Z",
    pipeline_steps: ["pm", "dev_lead", "dev"],
  } as unknown as HistoryEntry;
}

async function flush(): Promise<void> {
  await nextTick();
  await Promise.resolve();
  await Promise.resolve();
}

describe("useHistoryDetailLoad — snapshot run context", () => {
  beforeEach(() => {
    getLegacyTaskSnapshot.mockReset();
  });

  function setup(taskId: string | null) {
    const entry = computed(() => (taskId ? makeEntry(taskId) : null));
    return useHistoryDetailLoad({
      entry,
      isResumeAvailable: ref(false),
      resumeStepId: ref(""),
      loadResumeOptions: () => {},
    });
  }

  it("captures executed steps and failed_step from the task snapshot", async () => {
    getLegacyTaskSnapshot.mockResolvedValue({
      history: [{ agent: "pm", message: "ok", status: "completed" }],
      pipeline_steps: ["pm", "dev", "qa"],
      failed_step: "dev",
      status: "failed",
    });
    const { remoteEvents, remoteSteps, remoteFailedStep, remoteStatus } =
      setup("task-1");
    await flush();
    expect(getLegacyTaskSnapshot).toHaveBeenCalledWith("task-1");
    expect(remoteEvents.value).toHaveLength(1);
    expect(remoteSteps.value).toEqual(["pm", "dev", "qa"]);
    expect(remoteFailedStep.value).toBe("dev");
    expect(remoteStatus.value).toBe("failed");
  });

  it("clears snapshot context when the load fails", async () => {
    getLegacyTaskSnapshot.mockRejectedValue(new Error("404"));
    const { remoteEvents, remoteSteps, remoteFailedStep, remoteEventsError } =
      setup("task-2");
    await flush();
    expect(remoteEvents.value).toEqual([]);
    expect(remoteSteps.value).toEqual([]);
    expect(remoteFailedStep.value).toBe("");
    expect(remoteEventsError.value).toContain("404");
  });

  it("tolerates snapshots without the new fields", async () => {
    getLegacyTaskSnapshot.mockResolvedValue({ history: [] });
    const { remoteSteps, remoteFailedStep } = setup("task-3");
    await flush();
    expect(remoteSteps.value).toEqual([]);
    expect(remoteFailedStep.value).toBe("");
  });
});
