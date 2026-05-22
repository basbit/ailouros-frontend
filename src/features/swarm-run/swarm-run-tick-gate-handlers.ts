import type { Ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUiStore } from "@/shared/store/ui";
import { useProjectsStore } from "@/shared/store/projects";
import {
  fetchPendingShellCommands,
  fetchPendingManualShell,
  fetchFailedStep,
  fetchCurrentPipelineSteps,
} from "@/shared/lib/task-gate-actions";

const HUMAN_GATE_MESSAGE_PREVIEW_LENGTH = 500;
const NEEDS_CLARIFICATION_MARKER = "NEEDS_CLARIFICATION";

type UiStore = ReturnType<typeof useUiStore>;
type ProjectsStore = ReturnType<typeof useProjectsStore>;
type Translator = ReturnType<typeof useI18n>["t"];
type TaskRecord = Record<string, unknown>;

interface HistoryEntry {
  agent?: string;
  message?: string;
  timestamp?: string;
}

interface StatusHandlerContext {
  taskId: string;
  taskPayload: TaskRecord;
}

type StatusHandler = (context: StatusHandlerContext) => void;

export interface GateHandlerDeps {
  ui: UiStore;
  projectsStore: ProjectsStore;
  translate: Translator;
  currentPipelineSteps: Ref<string[]>;
  loadPipelinePlan: (taskId: string, reason?: string) => Promise<void>;
}

function buildHumanGateTitle(taskPayload: TaskRecord, translate: Translator): string {
  const history = (taskPayload.history as HistoryEntry[] | undefined) ?? [];
  const lastEntry = history[history.length - 1];
  const lastMessage = lastEntry?.message ? String(lastEntry.message) : "";
  if (lastMessage.includes(NEEDS_CLARIFICATION_MARKER)) {
    return translate("humanGate.clarificationRequired");
  }
  return `${translate("humanGate.awaitingReviewInput")} ${lastMessage.slice(
    0,
    HUMAN_GATE_MESSAGE_PREVIEW_LENGTH,
  )}`;
}

function hideAllGates(ui: UiStore): void {
  ui.humanGateVisible = false;
  ui.shellGateVisible = false;
  ui.manualShellGateVisible = false;
  ui.retryGateVisible = false;
}

export function createGateHandlers(
  deps: GateHandlerDeps,
): Record<string, StatusHandler> {
  const { ui, projectsStore, translate, currentPipelineSteps, loadPipelinePlan } = deps;

  function handleAwaitingHumanGate({
    taskId,
    taskPayload,
  }: StatusHandlerContext): void {
    if (ui.humanGateSubmitting) {
      return;
    }
    ui.humanGateVisible = true;
    ui.shellGateVisible = false;
    ui.retryGateVisible = false;
    ui.humanGateTitle = buildHumanGateTitle(taskPayload, translate);
    const mcpPhase = String(taskPayload.mcp_phase || "");
    void loadPipelinePlan(taskId, `awaiting_human:${mcpPhase}`);
  }

  function handleAwaitingShellGate({ taskId }: StatusHandlerContext): void {
    ui.shellGateVisible = true;
    ui.humanGateVisible = false;
    ui.manualShellGateVisible = false;
    ui.retryGateVisible = false;
    void fetchPendingShellCommands(taskId).then((payload) => {
      ui.shellGateCommands = payload.commands;
      ui.shellGateNeedsAllowlist = payload.needs_allowlist;
      ui.shellGateAlreadyAllowed = payload.already_allowed;
    });
  }

  function handleAwaitingManualShellGate({ taskId }: StatusHandlerContext): void {
    ui.manualShellGateVisible = true;
    ui.humanGateVisible = false;
    ui.shellGateVisible = false;
    ui.retryGateVisible = false;
    void fetchPendingManualShell(taskId).then((payload) => {
      ui.manualShellCommands = payload.commands;
      ui.manualShellReason = payload.reason;
    });
  }

  function handleFailedGate({ taskId }: StatusHandlerContext): void {
    ui.humanGateVisible = false;
    ui.shellGateVisible = false;
    ui.manualShellGateVisible = false;
    ui.retryGateVisible = true;
    void fetchFailedStep(taskId).then((step) => {
      ui.retryFailedStep = step;
    });
    void fetchCurrentPipelineSteps(taskId).then((steps) => {
      currentPipelineSteps.value = steps;
    });
    void loadPipelinePlan(taskId, "failed");
    ui.persistActiveTask(null, projectsStore.currentId);
  }

  function handleCompletedGate({ taskId }: StatusHandlerContext): void {
    hideAllGates(ui);
    ui.persistActiveTask(null, projectsStore.currentId);
    void loadPipelinePlan(taskId, "completed");
  }

  function handleRunningGate(): void {
    hideAllGates(ui);
  }

  return {
    awaiting_human: handleAwaitingHumanGate,
    awaiting_shell_confirm: handleAwaitingShellGate,
    awaiting_manual_shell: handleAwaitingManualShellGate,
    failed: handleFailedGate,
    completed: handleCompletedGate,
    running: handleRunningGate,
    in_progress: handleRunningGate,
  };
}
