/**
 * useSwarmRunTickHandler — WS tick + orchestrator-event handling and pipeline-plan loading.
 * Extracted from useSwarmRunController.ts (plan §20.1.4) — no behaviour change.
 */
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
import { apiUrl } from "@/shared/api/base";
import { type OrchestratorStreamEvent } from "@/shared/lib/chat-stream-events";
import {
  fetchPendingShellCommands,
  fetchPendingManualShell,
  fetchFailedStep,
  fetchCurrentPipelineSteps,
} from "@/shared/lib/task-gate-actions";
import { hydrateTaskFromServer } from "@/shared/lib/hydrate-task";
import { getTaskPipelinePlan } from "@/shared/api/endpoints/pipeline";
import type { SwarmRunState } from "./useSwarmRunState";

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
  const { t } = useI18n();

  let pipelinePlanRequestId = 0;
  const pipelinePlanInflight = new Map<string, Promise<void>>();

  async function loadPipelinePlan(tid: string, reason = "default"): Promise<void> {
    if (!tid) return;
    const loadKey = `${tid}:${reason}`;
    if (lastPipelinePlanLoadKey.value === loadKey) return;
    const existing = pipelinePlanInflight.get(tid);
    if (existing) {
      await existing;
      return;
    }
    const requestId = ++pipelinePlanRequestId;
    const promise = getTaskPipelinePlan(tid)
      .then((plan) => {
        if (requestId !== pipelinePlanRequestId || ui.taskId !== tid) return;
        ui.taskPipelinePlan = plan;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .catch(() => {
        if (requestId !== pipelinePlanRequestId || ui.taskId !== tid) return;
        ui.taskPipelinePlan = null;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .finally(() => {
        pipelinePlanInflight.delete(tid);
      });
    pipelinePlanInflight.set(tid, promise);
    await promise;
  }

  async function syncTaskFromServer(tid: string): Promise<void> {
    const h = await hydrateTaskFromServer(tid);
    if (h) applyHydratedTask(h);
    await loadPipelinePlan(tid, "sync");
  }

  function applyTick(d: Record<string, unknown>): void {
    if (d.capabilities) {
      ui.capabilities = d.capabilities as {
        workspace_write?: boolean;
        command_exec?: boolean;
      };
    }
    if (d.metrics) {
      const m = d.metrics as typeof ui.hostMetrics;
      ui.hostMetrics = m;
      // Record into the chart's ring buffer. Pushing on every tick — even
      // when there's no active task — means the chart already has context
      // when a run starts, instead of starting from a single point.
      ui.pushHostMetricsSample(m);
    }

    if (!ui.taskId) {
      // During the short optimistic-start window we intentionally show the
      // run as active before the backend returns X-Task-Id. The WS channel
      // still emits idle ticks (`task: null`) in that gap; do not let them
      // reset the UI back to idle or the Start button will flicker/stick.
      if (runBootstrapPending.value) return;
      ui.resetTaskView();
      taskStore.resetTask();
      return;
    }

    const j = d.task as Record<string, unknown> | undefined;
    if (!j) return;

    const status = j.status as string | null;
    ui.taskStatus = status as typeof ui.taskStatus;
    ui.taskError = j.error ?? null;

    if (status === "awaiting_human" && ui.taskId) {
      ui.humanGateVisible = true;
      ui.humanGateSubmitting = false;
      ui.shellGateVisible = false;
      ui.retryGateVisible = false;
      const hist =
        (j.history as { agent?: string; message?: string }[] | undefined) ?? [];
      const last = hist[hist.length - 1];
      const msg = last?.message ? String(last.message) : "";
      if (msg.includes("NEEDS_CLARIFICATION")) {
        ui.humanGateTitle = t("humanGate.clarificationRequired");
      } else {
        ui.humanGateTitle = `${t("humanGate.awaitingReviewInput")} ${msg.slice(0, 500)}`;
      }
      void loadPipelinePlan(ui.taskId, `awaiting_human:${String(j.mcp_phase || "")}`);
    } else if (status === "awaiting_shell_confirm" && ui.taskId) {
      ui.shellGateVisible = true;
      ui.humanGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
      void fetchPendingShellCommands(ui.taskId).then((payload) => {
        ui.shellGateCommands = payload.commands;
        ui.shellGateNeedsAllowlist = payload.needs_allowlist;
        ui.shellGateAlreadyAllowed = payload.already_allowed;
      });
    } else if (status === "awaiting_manual_shell" && ui.taskId) {
      ui.manualShellGateVisible = true;
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.retryGateVisible = false;
      void fetchPendingManualShell(ui.taskId).then((payload) => {
        ui.manualShellCommands = payload.commands;
        ui.manualShellReason = payload.reason;
      });
    } else if (status === "failed" && ui.taskId) {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = true;
      const tid = ui.taskId;
      void fetchFailedStep(tid).then((step) => {
        ui.retryFailedStep = step;
      });
      void fetchCurrentPipelineSteps(tid).then((steps) => {
        currentPipelineSteps.value = steps;
      });
      void loadPipelinePlan(ui.taskId, "failed");
      ui.persistActiveTask(null, projectsStore.currentId);
    } else if (status === "completed") {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
      ui.persistActiveTask(null, projectsStore.currentId);
      if (ui.taskId) void loadPipelinePlan(ui.taskId, "completed");
    } else if (status === "running" || status === "in_progress") {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
    }

    if (j.error) {
      updateRunHistory(status, j.error);
      const errorText = String(j.error);
      if (lastNotifiedError.value !== errorText) {
        ux.notify(`${t("toast.runError")}: ${errorText}`, "error", 4200);
        lastNotifiedError.value = errorText;
      }
      taskStore.setTask({
        status: status as Parameters<typeof taskStore.setTask>[0]["status"],
        error: j.error,
        history: ui.taskHistory,
        agents: ui.taskAgents,
      });
      return;
    }

    const history =
      (j.history as
        | { agent?: string; message?: string; timestamp?: string }[]
        | undefined) ?? [];
    ui.taskHistory = history;
    ui.taskAgents = (j.agents as string[] | undefined) ?? [];

    const agents = ui.taskAgents;
    if (agents.length) ui.activeStep = agents[agents.length - 1];
    if (j.context_mode) ui.contextMode = String(j.context_mode);
    if (typeof j.tools_enabled === "boolean") ui.toolsEnabled = j.tools_enabled;
    if (j.mcp_phase) ui.mcpPhase = String(j.mcp_phase);
    ui.pendingApprovals =
      status === "awaiting_human" ||
      status === "awaiting_shell_confirm" ||
      status === "awaiting_manual_shell"
        ? 1
        : 0;

    ui.artifactPath = ui.taskId
      ? apiUrl("/artifacts/" + ui.taskId + "/pipeline.json")
      : null;
    updateRunHistory(status, j.error);
    if (!j.error) {
      lastNotifiedError.value = null;
    }

    taskStore.setTask({
      task_id: ui.taskId ?? undefined,
      status: status as Parameters<typeof taskStore.setTask>[0]["status"],
      error: j.error,
      history: history,
      agents: ui.taskAgents,
    });
  }

  function applyOrchestratorEvent(orchestratorEvent: OrchestratorStreamEvent): void {
    switch (orchestratorEvent.event) {
      case "run_started": {
        ui.taskStatus = "in_progress";
        ui.activeStep = null;
        ui.blockedReason = null;
        ui.blockedCode = null;
        ui.blockedStep = null;
        ui.retryingSteps = new Set();
        ui.orchestratorCompletedSteps = new Set();
        ui.verificationRunning = false;
        // A new run owns the chart window — drop accumulated idle samples
        // so the X axis starts at "now" and the user sees only this run.
        ui.clearHostMetricsHistory();
        return;
      }
      case "step_started": {
        if (orchestratorEvent.step) {
          ui.activeStep = orchestratorEvent.step;
          const retrying = new Set(ui.retryingSteps);
          retrying.delete(orchestratorEvent.step);
          ui.retryingSteps = retrying;
        }
        return;
      }
      case "step_completed": {
        if (orchestratorEvent.step) {
          const completed = new Set(ui.orchestratorCompletedSteps);
          completed.add(orchestratorEvent.step);
          ui.orchestratorCompletedSteps = completed;
          const retrying = new Set(ui.retryingSteps);
          retrying.delete(orchestratorEvent.step);
          ui.retryingSteps = retrying;
        }
        return;
      }
      case "step_retry_started": {
        if (orchestratorEvent.step) {
          ui.activeStep = orchestratorEvent.step;
          const retrying = new Set(ui.retryingSteps);
          retrying.add(orchestratorEvent.step);
          ui.retryingSteps = retrying;
        }
        return;
      }
      case "verification_layer_started": {
        ui.verificationRunning = true;
        return;
      }
      case "verification_layer_completed": {
        ui.verificationRunning = false;
        return;
      }
      case "pipeline_blocked": {
        ui.taskStatus = "blocked";
        ui.blockedReason = orchestratorEvent.reason ?? orchestratorEvent.message;
        ui.blockedCode = orchestratorEvent.code ?? null;
        ui.blockedStep = orchestratorEvent.step ?? null;
        ui.activeStep = null;
        ui.verificationRunning = false;
        return;
      }
      case "final_gate_denied":
      case "run_finished": {
        ui.verificationRunning = false;
        return;
      }
    }
  }

  return {
    loadPipelinePlan,
    syncTaskFromServer,
    applyTick,
    applyOrchestratorEvent,
  };
}
