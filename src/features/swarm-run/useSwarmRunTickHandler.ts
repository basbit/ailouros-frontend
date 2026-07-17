import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
import { apiUrl } from "@/shared/api/base";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import { type OrchestratorStreamEvent } from "@/shared/lib/chat-stream-events";
import { resolveTaskFromServer } from "@/shared/lib/hydrate-task";
import { getTaskPipelinePlan } from "@/shared/api/endpoints/pipeline";
import { applyOrchestratorEvent as applyOrchestratorEventToUi } from "./swarm-run-orchestrator-applier";
import { createGateHandlers, hideAllGates } from "./swarm-run-tick-gate-handlers";
import type { SwarmRunState } from "./useSwarmRunState";

type TaskRecord = Record<string, unknown>;
type SetTaskInput = Parameters<SwarmRunState["taskStore"]["setTask"]>[0];

const TASK_NOT_FOUND_ERROR = "not_found";

interface HistoryEntry {
  agent?: string;
  message?: string;
  timestamp?: string;
}

export function useSwarmRunTickHandler(state: SwarmRunState) {
  const {
    ui,
    taskStore,
    projectsStore,
    currentPipelineSteps,
    lastNotifiedError,
    runBootstrapPending,
    lastPipelinePlanLoadKey,
    applyHydratedTask,
    updateRunHistory,
  } = state;
  const ux = useUxStore();
  const { t: translate } = useI18n();

  let pipelinePlanRequestId = 0;
  const pipelinePlanInflight = new Map<string, Promise<void>>();

  async function loadPipelinePlan(taskId: string, reason = "default"): Promise<void> {
    if (!taskId) return;
    const loadKey = `${taskId}:${reason}`;
    if (lastPipelinePlanLoadKey.value === loadKey) return;
    const existing = pipelinePlanInflight.get(taskId);
    if (existing) {
      await existing;
      return;
    }
    const requestId = ++pipelinePlanRequestId;
    const promise = getTaskPipelinePlan(taskId)
      .then((plan) => {
        if (requestId !== pipelinePlanRequestId || ui.taskId !== taskId) return;
        ui.taskPipelinePlan = plan;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .catch((error: unknown) => {
        frontendLogger.warn("swarm-run-tick: pipeline plan fetch failed", {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
        if (requestId !== pipelinePlanRequestId || ui.taskId !== taskId) return;
        ui.taskPipelinePlan = null;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .finally(() => {
        pipelinePlanInflight.delete(taskId);
      });
    pipelinePlanInflight.set(taskId, promise);
    await promise;
  }

  function markRunUnavailable(): void {
    ui.runAvailability = "unavailable";
    ui.runAvailabilityError = null;
    ui.taskStatus = null;
    ui.activeStep = null;
    ui.pendingApprovals = 0;
    hideAllGates(ui);
  }

  async function syncTaskFromServer(taskId: string): Promise<void> {
    const resolution = await resolveTaskFromServer(taskId);
    if (resolution.outcome === "unknown") {
      markRunUnavailable();
      return;
    }
    if (resolution.outcome === "error") {
      ui.runAvailability = "lookup_failed";
      ui.runAvailabilityError = resolution.message;
      ui.taskStatus = null;
      return;
    }
    const task = resolution.task;
    ui.runAvailability = "resolved";
    ui.runAvailabilityError = null;
    applyHydratedTask(task);
    // Restoring an already-paused run (page reload / opening an active run)
    // must re-surface its gate — e.g. the clarification answer form for an
    // awaiting_human run. Only the live tick path did this before, so a
    // reloaded awaiting_human run showed no answer window.
    applyTaskGateForStatus(task.status, taskId, {
      history: task.history,
      agents: task.agents,
      status: task.status,
      error: task.error,
    });
    await loadPipelinePlan(taskId, "sync");
  }

  const statusGateHandlers = createGateHandlers({
    ui,
    projectsStore,
    translate,
    currentPipelineSteps,
    loadPipelinePlan,
  });

  function applyTaskGateForStatus(
    status: string | null,
    taskId: string,
    taskPayload: TaskRecord,
  ): void {
    if (!status) return;
    const handler = statusGateHandlers[status];
    if (handler) handler({ taskId, taskPayload });
  }

  function applyCapabilities(tickPayload: TaskRecord): void {
    if (!tickPayload.capabilities) return;
    ui.capabilities = tickPayload.capabilities as {
      workspace_write?: boolean;
      command_exec?: boolean;
    };
  }

  function applyHostMetricsSnapshot(tickPayload: TaskRecord): void {
    if (!tickPayload.metrics) return;
    const metricsSnapshot = tickPayload.metrics as typeof ui.hostMetrics;
    ui.hostMetrics = metricsSnapshot;
    ui.pushHostMetricsSample(metricsSnapshot);
  }

  function resetViewIfNoTask(): boolean {
    if (ui.taskId) return false;
    if (runBootstrapPending.value) return true;
    ui.resetTaskView();
    taskStore.resetTask();
    return true;
  }

  function notifyRunErrorOnce(errorText: string): void {
    if (lastNotifiedError.value === errorText) return;
    ux.notify(`${translate("toast.runError")}: ${errorText}`, "error", 4200);
    lastNotifiedError.value = errorText;
  }

  function applyTaskError(status: string | null, taskPayload: TaskRecord): void {
    updateRunHistory(status, taskPayload.error);
    notifyRunErrorOnce(String(taskPayload.error));
    taskStore.setTask({
      status: status as SetTaskInput["status"],
      error: taskPayload.error,
      history: ui.taskHistory,
      agents: ui.taskAgents,
    });
  }

  function applyPendingApprovalsFlag(status: string | null): void {
    const isPending =
      status === "awaiting_human" ||
      status === "awaiting_shell_confirm" ||
      status === "awaiting_manual_shell";
    ui.pendingApprovals = isPending ? 1 : 0;
  }

  function deriveActiveStepFromHistory(history: HistoryEntry[]): string | null {
    for (let index = history.length - 1; index >= 0; index -= 1) {
      const agent = (history[index]?.agent ?? "").trim().toLowerCase();
      if (!agent || agent === "orchestrator") continue;
      return agent;
    }
    return null;
  }

  function applyTaskHistoryAndAgents(
    status: string | null,
    taskPayload: TaskRecord,
  ): void {
    const history = (taskPayload.history as HistoryEntry[] | undefined) ?? [];
    ui.taskHistory = history;
    ui.taskAgents = (taskPayload.agents as string[] | undefined) ?? [];
    const agents = ui.taskAgents;
    if (agents.length) {
      ui.activeStep = agents[agents.length - 1];
    } else {
      const historyStep = deriveActiveStepFromHistory(history);
      if (historyStep) ui.activeStep = historyStep;
    }
    if (taskPayload.context_mode) ui.contextMode = String(taskPayload.context_mode);
    if (typeof taskPayload.tools_enabled === "boolean") {
      ui.areToolsEnabled = taskPayload.tools_enabled;
    }
    if (taskPayload.mcp_phase) ui.mcpPhase = String(taskPayload.mcp_phase);
    applyPendingApprovalsFlag(status);
    ui.artifactPath = ui.taskId
      ? apiUrl("/artifacts/" + ui.taskId + "/pipeline.json")
      : null;
    updateRunHistory(status, taskPayload.error);
    if (!taskPayload.error) lastNotifiedError.value = null;
    taskStore.setTask({
      task_id: ui.taskId ?? undefined,
      status: status as SetTaskInput["status"],
      error: taskPayload.error,
      history,
      agents: ui.taskAgents,
    });
  }

  function applyTick(tickPayload: TaskRecord): void {
    applyCapabilities(tickPayload);
    applyHostMetricsSnapshot(tickPayload);
    if (resetViewIfNoTask()) return;
    const taskPayload = tickPayload.task as TaskRecord | undefined;
    if (!taskPayload) return;
    if (taskPayload.error === TASK_NOT_FOUND_ERROR) {
      markRunUnavailable();
      return;
    }
    const status = (taskPayload.status as string | null) ?? null;
    ui.runAvailability = "resolved";
    ui.runAvailabilityError = null;
    ui.taskStatus = status as typeof ui.taskStatus;
    ui.taskError = (taskPayload.error as typeof ui.taskError) ?? null;
    if (ui.taskId) applyTaskGateForStatus(status, ui.taskId, taskPayload);
    if (taskPayload.error) {
      applyTaskError(status, taskPayload);
      return;
    }
    applyTaskHistoryAndAgents(status, taskPayload);
  }

  function applyOrchestratorEvent(event: OrchestratorStreamEvent): void {
    applyOrchestratorEventToUi(ui, event);
  }

  return {
    loadPipelinePlan,
    syncTaskFromServer,
    applyTick,
    applyOrchestratorEvent,
  };
}
