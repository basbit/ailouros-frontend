/**
 * A phase gate is decided in its own card, not in the free-text human gate.
 *
 * Since the backend started reporting a phase-gate pause as `awaiting_human`
 * (so History and the pipeline bar can show "there is a question"), the generic
 * human-gate overlay opened for it too. The operator then saw two inputs for
 * one decision, and the overlay's "send and continue" posts to
 * `/v1/tasks/{id}/human-resume` — the resume path for a finished, paused run.
 * A run blocked inside `wait_for_phase_gate_decision` is still streaming and has
 * written no pipeline.json to resume from, so that button cannot work: the gate
 * stays pending and the operator is told nothing.
 *
 * The backend reports the pause by appending `{agent: "phase_gate"}` to the
 * task's history (`_report_gate_to_task_store`); no task store ever writes a
 * top-level `agent`, so the last history row is the only discriminator.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createPinia, setActivePinia } from "pinia";

import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/entities/project";
import { createGateHandlers } from "./swarm-run-tick-gate-handlers";

vi.mock("@/shared/api/endpoints/pipeline", () => ({
  getTaskPipelinePlan: vi.fn().mockResolvedValue({ steps: [] }),
}));
vi.mock("@/features/swarm-run/task-gate-actions", () => ({
  fetchPendingShellCommands: vi
    .fn()
    .mockResolvedValue({ commands: [], needs_allowlist: false, already_allowed: false }),
  fetchPendingManualShell: vi.fn().mockResolvedValue({ commands: [], reason: "" }),
  fetchFailedStep: vi.fn().mockResolvedValue(null),
  fetchCurrentPipelineSteps: vi.fn().mockResolvedValue([]),
}));

const TASK_ID = "71a4c641-1ca3-4c33-9614-62c7dfc9f381";

function handlersFor(ui: ReturnType<typeof useUiStore>) {
  return createGateHandlers({
    ui,
    projectsStore: useProjectsStore(),
    translate: (key: string) => key,
    currentPipelineSteps: ref([]),
    loadPipelinePlan: vi.fn(),
  });
}

describe("awaiting_human — which surface takes the answer", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("leaves a phase-gate pause to the phase-gate card", () => {
    const ui = useUiStore();
    handlersFor(ui).awaiting_human({
      taskId: TASK_ID,
      taskPayload: {
        status: "awaiting_human",
        agents: ["pm", "phase_gate"],
        history: [
          { agent: "pm", message: "plan ready", timestamp: "2026-09-16T10:00:00Z" },
          {
            agent: "phase_gate",
            message: "Phase 'execute' needs human verification (gate gate-43a85aed9581)",
            timestamp: "2026-09-16T10:00:01Z",
          },
        ],
      } as never,
    });

    expect(ui.humanGateVisible).toBe(false);
  });

  it("ignores a top-level `agent` — no task store writes one, so it must not be trusted", () => {
    const ui = useUiStore();
    handlersFor(ui).awaiting_human({
      taskId: TASK_ID,
      taskPayload: {
        status: "awaiting_human",
        agent: "phase_gate",
        history: [{ agent: "dev", message: "Review the plan before the stories run." }],
      } as never,
    });

    expect(ui.humanGateVisible).toBe(true);
  });

  it("only the LAST history row counts — an earlier gate row is history, not the current pause", () => {
    const ui = useUiStore();
    handlersFor(ui).awaiting_human({
      taskId: TASK_ID,
      taskPayload: {
        status: "awaiting_human",
        history: [
          { agent: "phase_gate", message: "Phase 'spec' needs human verification" },
          { agent: "dev", message: "Review the epic plan before the remaining stories run." },
        ],
      } as never,
    });

    expect(ui.humanGateVisible).toBe(true);
  });

  it("still opens the human gate for a step that asks the operator directly", () => {
    const ui = useUiStore();
    handlersFor(ui).awaiting_human({
      taskId: TASK_ID,
      taskPayload: {
        status: "awaiting_human",
        history: [
          { agent: "dev", message: "Review the epic plan before the remaining stories run." },
        ],
      } as never,
    });

    expect(ui.humanGateVisible).toBe(true);
  });

  it("opens the human gate when the pause names no step at all", () => {
    const ui = useUiStore();
    handlersFor(ui).awaiting_human({
      taskId: TASK_ID,
      taskPayload: { status: "awaiting_human" } as never,
    });

    expect(ui.humanGateVisible).toBe(true);
  });
});
