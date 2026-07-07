import type { useUxStore } from "@/shared/store/ux";
import type { RunSwarmChatSettings } from "@/shared/lib/agent-config";
import {
  submitHumanResume,
  confirmShell,
  confirmHuman,
  confirmManualShell,
  fetchPendingHuman,
  submitRetry,
  submitContinuePipeline,
  type GateActionResult,
} from "@/shared/lib/task-gate-actions";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";

export interface SwarmRunGateActionsDeps {
  state: SwarmRunState;
  tickHandler: ReturnType<typeof useSwarmRunTickHandler>;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
  ux: ReturnType<typeof useUxStore>;
}

export function useSwarmRunGateActions(deps: SwarmRunGateActionsDeps) {
  const { state, tickHandler, sendWsSubscribe, settings, ux } = deps;
  const { ui } = state;
  const { applyOrchestratorEvent } = tickHandler;

  function notifyGateError(result: GateActionResult): void {
    if (!result.ok && result.error) ux.notify(result.error, "error", 4200);
  }

  async function onHumanResume(feedback?: string): Promise<void> {
    if (!ui.taskId) return;
    const taskId = ui.taskId;
    const effectiveFeedback = feedback ?? ui.humanGateFeedback;
    if (ui.humanGateSubmitting) return;
    ui.humanGateSubmitting = true;
    ui.humanGateVisible = false;
    ui.taskStatus = "in_progress";
    ui.pendingApprovals = 0;
    try {
      const pending = await fetchPendingHuman(taskId);
      const result = pending?.pending
        ? await confirmHuman(taskId, true, effectiveFeedback)
        : await submitHumanResume(
            taskId,
            effectiveFeedback,
            sendWsSubscribe,
            (event) => {
              if (event.kind === "orchestrator") applyOrchestratorEvent(event);
            },
            settings,
          );
      notifyGateError(result);
      ui.humanGateFeedback = "";
    } catch (err) {
      ui.humanGateVisible = true;
      throw err;
    } finally {
      ui.humanGateSubmitting = false;
    }
  }

  async function onConfirmShell(approved: boolean): Promise<void> {
    if (!ui.taskId) return;
    notifyGateError(await confirmShell(ui.taskId, approved));
    ui.shellGateVisible = false;
    ui.shellGateCommands = [];
  }

  async function onConfirmManualShell(done: boolean): Promise<void> {
    if (!ui.taskId) return;
    notifyGateError(await confirmManualShell(ui.taskId, done));
    ui.manualShellGateVisible = false;
    ui.manualShellCommands = [];
    ui.manualShellReason = "";
  }

  async function onRetry(fromBeginning: boolean): Promise<void> {
    if (!ui.taskId) return;
    ui.retryGateVisible = false;
    notifyGateError(
      await submitRetry(ui.taskId, fromBeginning, settings, sendWsSubscribe),
    );
  }

  async function onContinuePipeline(additionalSteps: string[]): Promise<void> {
    if (!ui.taskId) return;
    ui.retryGateVisible = false;
    notifyGateError(
      await submitContinuePipeline(
        ui.taskId,
        additionalSteps,
        settings,
        sendWsSubscribe,
      ),
    );
  }

  return {
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
  };
}
