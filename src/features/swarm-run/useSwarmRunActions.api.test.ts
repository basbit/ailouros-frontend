import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/store/ux", () => ({
  useUxStore: () => ({ notify: vi.fn() }),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("./useSwarmRunPreflight", () => ({
  useSwarmRunPreflight: () => ({
    resolveScenario: vi.fn(),
    surfacePreflightFailure: vi.fn(),
  }),
}));

import { useSwarmRunActions } from "./useSwarmRunActions";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

function makeActions() {
  const state = {
    ui: {},
    taskStore: {},
    projectsStore: { currentId: "default" },
    currentPipelineSteps: { value: [] },
    lastNotifiedError: { value: null },
    runBootstrapPending: { value: false },
    lastPipelinePlanLoadKey: { value: "" },
    waitForUiPaint: vi.fn(),
  } as unknown as SwarmRunState;
  const tickHandler = {
    applyOrchestratorEvent: vi.fn(),
  } as unknown as ReturnType<typeof useSwarmRunTickHandler>;
  return useSwarmRunActions({
    state,
    tickHandler,
    sendWsSubscribe: vi.fn(),
    settings: { form: {} } as never,
  });
}

const EXPECTED_API = [
  "onStartRun",
  "onStopRun",
  "onHumanResume",
  "onConfirmShell",
  "onConfirmManualShell",
  "onRetry",
  "onContinuePipeline",
  "onForkStep",
] as const;

describe("useSwarmRunActions composed API surface", () => {
  it("exposes exactly the documented action methods, all callable", () => {
    const actions = makeActions();
    expect(Object.keys(actions).sort()).toEqual([...EXPECTED_API].sort());
    for (const name of EXPECTED_API) {
      expect(typeof (actions as Record<string, unknown>)[name]).toBe("function");
    }
  });
});
