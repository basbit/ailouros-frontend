/**
 * History detail for run A must not mount the live gate overlay while run B
 * (the one this browser drives) is the one asking. `isCurrentRunAwaiting`
 * used to fall back to `ui.taskStatus` and the live gate flags for any entry.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { computed } from "vue";

import { useUiStore, type HistoryEntry } from "@/shared/store/ui";

vi.mock("@/features/swarm-run", () => ({
  useInjectedSwarmRunController: () => ({
    isRunning: computed(() => false),
    currentPipelineSteps: computed(() => []),
    syncTaskFromServer: vi.fn(),
    sendWsSubscribe: vi.fn(),
    onStopRun: vi.fn(),
    onContinuePipeline: vi.fn(),
    onHumanResume: vi.fn(),
    onConfirmShell: vi.fn(),
    onConfirmManualShell: vi.fn(),
    onRetry: vi.fn(),
  }),
}));
vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

import { useRunLiveBody } from "./useRunLiveBody";

function entry(taskId: string, status: HistoryEntry["status"]): HistoryEntry {
  return { id: `e-${taskId}`, at: 1, prompt: "p", agent_config: null, pipeline_steps: [], taskId, status } as HistoryEntry;
}

function bodyFor(historyEntry: HistoryEntry | null, historyStatus: string | null = null) {
  return useRunLiveBody({
    hideHeader: false,
    historyEntry,
    historyEvents: [],
    historySteps: null,
    historyFailedStep: null,
    historyStatus,
  });
}

describe("useRunLiveBody.isCurrentRunAwaiting", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("run A open while run B is gated: A shows no gate", () => {
    const ui = useUiStore();
    ui.taskId = "B";
    ui.taskStatus = "awaiting_human";
    ui.humanGateVisible = true;

    expect(bodyFor(entry("A", "completed")).isCurrentRunAwaiting.value).toBe(false);
  });

  it("run A paused on the server, but not the live run: no overlay (it could only answer B)", () => {
    const ui = useUiStore();
    ui.taskId = "B";
    ui.taskStatus = "running";

    expect(bodyFor(entry("A", "awaiting_human")).isCurrentRunAwaiting.value).toBe(false);
  });

  it("the live run's own history page shows its gate", () => {
    const ui = useUiStore();
    ui.taskId = "A";
    ui.humanGateVisible = true;

    expect(bodyFor(entry("A", "running")).isCurrentRunAwaiting.value).toBe(true);
  });

  it("reads the authoritative history status over the stale entry status", () => {
    const ui = useUiStore();
    ui.taskId = "A";

    expect(bodyFor(entry("A", "running"), "awaiting_human").isCurrentRunAwaiting.value).toBe(true);
    expect(bodyFor(entry("A", "awaiting_human"), "completed").isCurrentRunAwaiting.value).toBe(false);
  });

  it("the live page (no history entry) follows the live status", () => {
    const ui = useUiStore();
    ui.taskId = "A";
    ui.taskStatus = "awaiting_shell_confirm";

    expect(bodyFor(null).isCurrentRunAwaiting.value).toBe(true);
  });
});
