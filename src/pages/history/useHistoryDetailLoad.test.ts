import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

describe("useHistoryDetailLoad — live refresh", () => {
  beforeEach(() => {
    getLegacyTaskSnapshot.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupLive(taskId: string) {
    const entry = computed(() => makeEntry(taskId));
    return useHistoryDetailLoad({
      entry,
      isResumeAvailable: ref(false),
      resumeStepId: ref(""),
      loadResumeOptions: () => {},
    });
  }

  it("keeps refreshing while the run is still in flight", async () => {
    // The regression: the snapshot was read once, so a running pipeline froze
    // at whatever it had done when the page opened.
    getLegacyTaskSnapshot.mockResolvedValue({
      status: "in_progress",
      history: [{ agent: "cross_validate", message: "still working" }],
      pipeline_steps: ["clarify_input", "cross_validate"],
    });

    const state = setupLive("task-live");
    await flush();
    expect(getLegacyTaskSnapshot).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3000);
    await flush();
    expect(getLegacyTaskSnapshot.mock.calls.length).toBeGreaterThan(1);
    expect(state.remoteStatus.value).toBe("in_progress");
  });

  it("stops refreshing once the run reaches a terminal status", async () => {
    getLegacyTaskSnapshot.mockResolvedValue({
      status: "completed",
      history: [],
      pipeline_steps: ["clarify_input"],
    });

    setupLive("task-done");
    await flush();
    const afterFirstLoad = getLegacyTaskSnapshot.mock.calls.length;

    await vi.advanceTimersByTimeAsync(15000);
    await flush();
    expect(getLegacyTaskSnapshot.mock.calls.length).toBe(afterFirstLoad);
  });
});
