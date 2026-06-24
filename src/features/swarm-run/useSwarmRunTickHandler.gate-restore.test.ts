import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/shared/store/projects";
import * as hydrateModule from "@/shared/lib/hydrate-task";
import { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: vi.fn().mockResolvedValue({ steps: [] }),
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));

const TASK_ID = "4e9ab0ca-f867-4088-8492-8ec53b15f16b";

function buildState(ui: ReturnType<typeof useUiStore>) {
  return {
    ui,
    taskStore: { setTask: vi.fn(), setTaskId: vi.fn(), resetTask: vi.fn() },
    projectsStore: useProjectsStore(),
    currentPipelineSteps: ref<string[]>([]),
    lastNotifiedError: ref<string | null>(null),
    runBootstrapPending: ref(false),
    lastPipelinePlanLoadKey: ref(""),
    applyHydratedTask: (h: { status: string | null; history: unknown[] }) => {
      ui.taskStatus = h.status as typeof ui.taskStatus;
      ui.taskHistory = h.history as typeof ui.taskHistory;
    },
    updateRunHistory: vi.fn(),
  } as never;
}

describe("syncTaskFromServer gate restore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("shows the human gate when restoring an awaiting_human run", async () => {
    vi.spyOn(hydrateModule, "hydrateTaskFromServer").mockResolvedValue({
      taskId: TASK_ID,
      history: [
        {
          agent: "orchestrator",
          message: "NEEDS_CLARIFICATION\n\nQuestions for the user: ...",
          timestamp: "2026-06-23T11:32:16Z",
        },
      ],
      status: "awaiting_human",
      error: null,
      agents: [],
      artifactPath: null,
      fromLogFallback: false,
      scenarioId: null,
      scenarioTitle: null,
      scenarioCategory: null,
    });

    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    expect(ui.humanGateVisible).toBe(false);
    await handler.syncTaskFromServer(TASK_ID);

    // Restoring an already-paused run must surface the clarification form.
    expect(ui.humanGateVisible).toBe(true);
  });
});
