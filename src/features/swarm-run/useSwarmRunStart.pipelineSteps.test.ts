import { describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const runSwarmChatMock = vi.fn();

vi.mock("@/shared/lib/run-swarm-chat", () => ({
  runSwarmChat: (...args: unknown[]) => runSwarmChatMock(...args),
}));

vi.mock("@/shared/lib/streaming-rag-events", () => ({
  recordRetrievalDone: vi.fn(),
  resetRetrievalEvents: vi.fn(),
}));

vi.mock("./useSwarmRunStreamHandler", () => ({
  createSwarmStreamEventHandler: () => vi.fn(),
}));

import { useSwarmRunStart } from "./useSwarmRunStart";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

const RESOLVED_STEPS = ["clarify_input", "pm", "ba", "architect"];

function makeStart() {
  const currentPipelineSteps = ref<string[]>([]);
  const state = {
    ui: {
      taskId: null as string | null,
      taskStatus: null as string | null,
      taskError: null,
      taskScenarioId: null,
      taskScenarioTitle: null,
      taskScenarioCategory: null,
      persistActiveTask: vi.fn(),
      resetTaskView: vi.fn(),
      pushHistory: vi.fn(),
    },
    taskStore: { resetTask: vi.fn(), setTaskId: vi.fn() },
    projectsStore: { currentId: "default" },
    currentPipelineSteps,
    lastNotifiedError: ref<string | null>(null),
    runBootstrapPending: ref(false),
    lastPipelinePlanLoadKey: ref(""),
    waitForUiPaint: vi.fn(),
  } as unknown as SwarmRunState;
  const tickHandler = {
    applyOrchestratorEvent: vi.fn(),
  } as unknown as ReturnType<typeof useSwarmRunTickHandler>;
  const start = useSwarmRunStart({
    state,
    tickHandler,
    sendWsSubscribe: vi.fn(),
    settings: { form: { prompt: "build a game" } } as never,
    ux: { notify: vi.fn() } as never,
    t: ((key: string) => key) as never,
    preflight: {
      resolveScenario: vi.fn(),
      surfacePreflightFailure: vi.fn(),
    } as never,
  });
  return { start, state, currentPipelineSteps };
}

describe("useSwarmRunStart pipeline steps", () => {
  it("publishes the run's resolved steps as soon as the task id arrives", async () => {
    const { start, currentPipelineSteps } = makeStart();
    runSwarmChatMock.mockImplementation(
      async (_settings: unknown, handlers: { onTaskId: (id: string, steps: string[]) => void }) => {
        handlers.onTaskId("task-1", RESOLVED_STEPS);
      },
    );

    await start.onStartRun();

    expect(currentPipelineSteps.value).toEqual(RESOLVED_STEPS);
  });
});
