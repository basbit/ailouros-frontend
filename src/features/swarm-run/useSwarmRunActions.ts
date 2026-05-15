/**
 * useSwarmRunActions — start/stop/resume/retry actions for a swarm run.
 * Extracted from useSwarmRunController.ts (plan §20.1.4) — no behaviour change.
 */
import { nextTick } from "vue";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { cancelTask } from "@/shared/api/endpoints/tasks-runtime";
import { type RunSwarmChatSettings } from "@/shared/lib/agent-config";
import { type ChatStreamEvent } from "@/shared/lib/chat-stream-events";
import { runSwarmChat } from "@/shared/lib/run-swarm-chat";
import {
  submitHumanResume,
  confirmShell,
  confirmHuman,
  confirmManualShell,
  fetchPendingHuman,
  submitRetry,
  submitContinuePipeline,
} from "@/shared/lib/task-gate-actions";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

interface ActionsDeps {
  state: SwarmRunState;
  tickHandler: ReturnType<typeof useSwarmRunTickHandler>;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
}

export function useSwarmRunActions({
  state,
  tickHandler,
  sendWsSubscribe,
  settings,
}: ActionsDeps) {
  const {
    ui,
    taskStore,
    projectsStore,
    currentPipelineSteps,
    lastNotifiedError,
    runBootstrapPending,
    lastPipelinePlanLoadKey,
    waitForUiPaint,
  } = state;
  const { applyOrchestratorEvent } = tickHandler;
  const ux = useUxStore();
  const { t } = useI18n();

  async function onStartRun(): Promise<void> {
    currentPipelineSteps.value = [];
    lastNotifiedError.value = null;
    runBootstrapPending.value = true;
    ui.persistActiveTask(null, projectsStore.currentId);
    ui.resetTaskView();
    lastPipelinePlanLoadKey.value = "";
    taskStore.resetTask();
    sendWsSubscribe();
    const pickedScenarioId = (settings.form.scenario_id ?? "").trim();
    ui.taskScenarioId = pickedScenarioId || null;
    ui.taskScenarioTitle = null;
    ui.taskScenarioCategory = null;
    // Show Stop button immediately — before any SSE events arrive from the backend.
    ui.taskStatus = "running";
    // Let Vue flush the reactive update and give the browser one paint before
    // the request setup / JSON serialization work starts.
    await nextTick();
    await waitForUiPaint();

    try {
      await runSwarmChat(
        settings,
        (tid) => {
          runBootstrapPending.value = false;
          ui.taskId = tid;
          ui.persistActiveTask(tid, projectsStore.currentId);
          taskStore.setTaskId(tid);
          sendWsSubscribe();
          ui.pushHistory(
            {
              prompt: settings.form.prompt,
              agent_config: null,
              pipeline_steps: settings.pipelineState.collectStepIds(),
              taskId: tid,
              workspace_root: settings.form.workspace_root || null,
              project_context_file: settings.form.project_context_file || null,
              workspace_write: settings.form.workspace_write,
              status: "running",
              startedAt: Date.now(),
            },
            projectsStore.currentId,
          );
          lastPipelinePlanLoadKey.value = "";
        },
        () => {
          /* stream done */
        },
        sendWsSubscribe,
        (event: ChatStreamEvent) => {
          // M-14 — surface auto_approved pipeline events as toast notifications
          if (event.kind === "auto_approved") {
            const step = event.step || "step";
            const rule = event.rule ? ` (${event.rule})` : "";
            ux.notify(`${t("toast.autoApproved", { step })}${rule}`, "info", 3500);
            return;
          }
          if (event.kind === "mcp_status") {
            const step = event.step || "step";
            const code = event.code ? ` [${event.code}]` : "";
            ux.notify(
              `MCP ${step}${code}: ${event.reason || event.message}`,
              event.explicitFallback ? "info" : "warning",
              4500,
            );
            return;
          }
          if (event.kind === "orchestrator") {
            applyOrchestratorEvent(event);
          }
        },
      );
    } catch (err: unknown) {
      runBootstrapPending.value = false;
      const msg = err instanceof Error ? err.message : String(err);
      ui.taskError = msg;
      ui.taskStatus = "failed";
      if (lastNotifiedError.value !== msg) {
        ux.notify(`${t("toast.runError")}: ${msg}`, "error", 4200);
        lastNotifiedError.value = msg;
      }
    } finally {
      if (!ui.taskId) {
        runBootstrapPending.value = false;
      }
    }
  }

  async function onStopRun(): Promise<void> {
    const tid = ui.taskId;
    if (!tid) return;
    try {
      await cancelTask(tid);
    } catch {
      // ignore network error — task may already be done
    }
    ui.taskStatus = "cancelled";
  }

  async function onHumanResume(): Promise<void> {
    if (!ui.taskId) return;
    const taskId = ui.taskId;
    const feedback = ui.humanGateFeedback;
    if (ui.humanGateSubmitting) return;
    ui.humanGateSubmitting = true;
    try {
      const pending = await fetchPendingHuman(taskId);
      if (pending?.pending) {
        await confirmHuman(taskId, true, feedback);
      } else {
        await submitHumanResume(taskId, feedback, sendWsSubscribe);
      }
      ui.humanGateFeedback = "";
    } finally {
      ui.humanGateSubmitting = false;
    }
  }

  async function onConfirmShell(approved: boolean): Promise<void> {
    if (!ui.taskId) return;
    await confirmShell(ui.taskId, approved);
    ui.shellGateVisible = false;
    ui.shellGateCommands = [];
  }

  async function onConfirmManualShell(done: boolean): Promise<void> {
    if (!ui.taskId) return;
    await confirmManualShell(ui.taskId, done);
    ui.manualShellGateVisible = false;
    ui.manualShellCommands = [];
    ui.manualShellReason = "";
  }

  async function onRetry(fromBeginning: boolean): Promise<void> {
    if (!ui.taskId) return;
    ui.retryGateVisible = false;
    await submitRetry(ui.taskId, fromBeginning, settings, sendWsSubscribe);
  }

  async function onContinuePipeline(additionalSteps: string[]): Promise<void> {
    if (!ui.taskId) return;
    ui.retryGateVisible = false;
    await submitContinuePipeline(ui.taskId, additionalSteps, settings, sendWsSubscribe);
  }

  return {
    onStartRun,
    onStopRun,
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
  };
}
