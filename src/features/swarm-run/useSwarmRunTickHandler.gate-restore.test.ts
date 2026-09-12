import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/entities/project";
import * as hydrateModule from "@/shared/lib/hydrate-task";
import { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: vi.fn().mockResolvedValue({ steps: [] }),
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (k: string) => k }),
}));
vi.mock("@/features/swarm-run/task-gate-actions", () => ({
  fetchPendingShellCommands: vi.fn().mockResolvedValue({
    commands: ["git init", "chmod +x run.sh"],
    needs_allowlist: true,
    already_allowed: false,
  }),
  fetchPendingManualShell: vi.fn().mockResolvedValue({ commands: [], reason: "" }),
  fetchFailedStep: vi.fn().mockResolvedValue(null),
  fetchCurrentPipelineSteps: vi.fn().mockResolvedValue([]),
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
    vi.spyOn(hydrateModule, "resolveTaskFromServer").mockResolvedValue({
      outcome: "found",
      task: {
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
        scenarioId: null,
        scenarioTitle: null,
        scenarioCategory: null,
      },
    });

    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    expect(ui.humanGateVisible).toBe(false);
    await handler.syncTaskFromServer(TASK_ID);

    // Restoring an already-paused run must surface the clarification form.
    expect(ui.humanGateVisible).toBe(true);
  });

  it("shows the shell approval gate when restoring an awaiting_shell_confirm run", async () => {
    vi.spyOn(hydrateModule, "resolveTaskFromServer").mockResolvedValue({
      outcome: "found",
      task: {
        taskId: TASK_ID,
        history: [],
        status: "awaiting_shell_confirm",
        error: null,
        agents: ["devops"],
        artifactPath: null,
        scenarioId: null,
        scenarioTitle: null,
        scenarioCategory: null,
      },
    });

    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    await handler.syncTaskFromServer(TASK_ID);
    await vi.waitFor(() => expect(ui.shellGateCommands).toHaveLength(2));

    expect(ui.shellGateVisible).toBe(true);
    expect(ui.shellGateCommands).toEqual(["git init", "chmod +x run.sh"]);
  });

  it("binds the shell gate from a live tick for a running task", async () => {
    const ui = useUiStore();
    ui.taskId = TASK_ID;
    const handler = useSwarmRunTickHandler(buildState(ui));

    handler.applyTick({
      type: "tick",
      task: { status: "awaiting_shell_confirm", history: [], agents: ["devops"] },
    });
    await vi.waitFor(() => expect(ui.shellGateCommands).toHaveLength(2));

    expect(ui.shellGateVisible).toBe(true);
  });
});
