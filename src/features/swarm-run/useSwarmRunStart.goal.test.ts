/**
 * `/goal … schedule: …` must schedule the goal in the store it was created in.
 * The schedule POST used to omit workspace_root, so the server looked for the
 * goal in a different store and the schedule never took effect.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const httpPostMock = vi.fn();
vi.mock("@/shared/api/http", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/http")>()),
  httpPost: (path: string, body: unknown) => httpPostMock(path, body),
}));
vi.mock("@/features/swarm-run/run-swarm-chat", () => ({ runSwarmChat: vi.fn() }));
vi.mock("@/shared/lib/streaming-rag-events", () => ({
  recordRetrievalDone: vi.fn(),
  resetRetrievalEvents: vi.fn(),
}));
vi.mock("./useSwarmRunStreamHandler", () => ({
  createSwarmStreamEventHandler: () => vi.fn(),
}));

import { useSwarmRunStart } from "./useSwarmRunStart";
import type { SwarmRunState } from "./useSwarmRunState";

function makeStart(prompt: string) {
  const notify = vi.fn();
  const settings = { form: { prompt, workspace_root: "/home/me/project" } };
  const start = useSwarmRunStart({
    state: {
      ui: {},
      taskStore: {},
      projectsStore: { currentId: "proj-1" },
      currentPipelineSteps: ref([]),
      lastNotifiedError: ref(null),
      runBootstrapPending: ref(false),
      lastPipelinePlanLoadKey: ref(""),
      waitForUiPaint: vi.fn(),
      updateRunHistory: vi.fn(),
    } as unknown as SwarmRunState,
    tickHandler: { applyOrchestratorEvent: vi.fn(), syncTaskFromServer: vi.fn() } as never,
    sendWsSubscribe: vi.fn(),
    settings: settings as never,
    ux: { notify } as never,
    t: ((key: string, vars?: Record<string, unknown>) =>
      vars ? `${key}:${JSON.stringify(vars)}` : key) as never,
    preflight: { resolveScenario: vi.fn(), surfacePreflightFailure: vi.fn() } as never,
  });
  return { start, notify, settings };
}

describe("useSwarmRunStart /goal with a schedule", () => {
  beforeEach(() => {
    httpPostMock.mockReset();
  });

  it("schedules in the same workspace the goal was created in, with the browser timezone", async () => {
    httpPostMock.mockResolvedValueOnce({ id: "g-1" }).mockResolvedValueOnce({});
    const { start } = makeStart("/goal Nightly audit\nschedule: cron 0 3 * * *");

    await start.onStartRun();

    expect(httpPostMock).toHaveBeenNthCalledWith(1, "/v1/goals", expect.objectContaining({
      workspace_root: "/home/me/project",
    }));
    expect(httpPostMock).toHaveBeenNthCalledWith(2, "/v1/goals/g-1/schedule", {
      cron: "0 3 * * *",
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      workspace_root: "/home/me/project",
    });
  });

  it("says the goal exists but is not scheduled when only the schedule is refused", async () => {
    httpPostMock
      .mockResolvedValueOnce({ id: "g-1" })
      .mockRejectedValueOnce(new Error("The goal scheduler is off"));
    const { start, notify, settings } = makeStart("/goal Nightly audit\nschedule: cron 0 3 * * *");

    await start.onStartRun();

    expect(notify).toHaveBeenCalledWith(
      'slashCommand.goal.scheduleFailed:{"title":"Nightly audit","error":"The goal scheduler is off"}',
      "error",
      8000,
    );
    expect(notify).not.toHaveBeenCalledWith(
      expect.stringContaining("slashCommand.goal.failed"),
      expect.anything(),
      expect.anything(),
    );
    expect(settings.form.prompt).toBe("");
  });
});
