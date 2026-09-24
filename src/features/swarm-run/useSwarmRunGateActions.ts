import type { useUxStore } from "@/shared/store/ux";
import type { RunSwarmChatSettings } from "@/entities/agent-config";
import type { PhaseGate, PhaseGateDecision } from "@/shared/model/phase-gate-types";
import { useI18n } from "@/shared/lib/i18n";
import {
  submitHumanResume,
  confirmShell,
  confirmHuman,
  confirmManualShell,
  fetchPendingHuman,
  submitRetry,
  submitContinuePipeline,
  type GateActionResult,
} from "@/features/swarm-run/task-gate-actions";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";
import { usePhaseGates } from "@/entities/phase-gate";

export interface SwarmRunGateActionsDeps {
  state: SwarmRunState;
  tickHandler: ReturnType<typeof useSwarmRunTickHandler>;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
  ux: ReturnType<typeof useUxStore>;
}

const ERROR_TOAST_MS = 4200;

export function useSwarmRunGateActions(deps: SwarmRunGateActionsDeps) {
  const { state, tickHandler, sendWsSubscribe, settings, ux } = deps;
  const { ui } = state;
  const { applyOrchestratorEvent } = tickHandler;
  const { decide, lastError: phaseGateError } = usePhaseGates();
  const { t } = useI18n();

  function notifyGateError(result: GateActionResult): void {
    if (!result.ok && result.error) ux.notify(result.error, "error", ERROR_TOAST_MS);
  }

  /**
   * The gate is answered optimistically (status flips to in_progress so the
   * UI stops asking); when the request fails the previous state comes back so
   * the question is still on screen and can be answered again.
   */
  function rememberGateState() {
    const previous = {
      taskStatus: ui.taskStatus,
      pendingApprovals: ui.pendingApprovals,
    };
    return () => {
      ui.taskStatus = previous.taskStatus;
      ui.pendingApprovals = previous.pendingApprovals;
    };
  }

  async function onHumanResume(feedback?: string, targetTaskId?: string): Promise<boolean> {
    const taskId = targetTaskId ?? ui.taskId;
    if (!taskId) return false;
    if (targetTaskId && !ui.taskId) ui.taskId = targetTaskId;
    const effectiveFeedback = feedback ?? ui.humanGateFeedback;
    if (ui.humanGateSubmitting) return false;
    const restore = rememberGateState();
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
      if (!result.ok) {
        restore();
        ui.humanGateVisible = true;
        notifyGateError(result);
        return false;
      }
      ui.humanGateFeedback = "";
      return true;
    } catch (err) {
      restore();
      ui.humanGateVisible = true;
      const message = err instanceof Error ? err.message : String(err);
      ux.notify(t("humanGate.resumeFailed", { error: message }), "error", ERROR_TOAST_MS);
      return false;
    } finally {
      ui.humanGateSubmitting = false;
    }
  }

  /**
   * A phase gate is decided explicitly — never inferred from free text. The
   * caller passes the gate it showed the operator, so a gate of another run
   * can never be decided by accident.
   */
  async function onDecidePhaseGate(
    gate: PhaseGate,
    decision: PhaseGateDecision,
    rationale: string,
  ): Promise<boolean> {
    const root = (settings.form.workspace_root ?? "").trim();
    if (!root) return false;
    const restore = rememberGateState();
    ui.taskStatus = "in_progress";
    ui.pendingApprovals = 0;
    const ok = await decide(gate.gateId, {
      workspaceRoot: root,
      decision,
      rationale: rationale.trim(),
    });
    if (!ok) {
      restore();
      ux.notify(
        t("phaseGates.decideFailed", { error: phaseGateError.value ?? "" }),
        "error",
        ERROR_TOAST_MS,
      );
    }
    return ok;
  }

  async function onConfirmShell(approved: boolean, targetTaskId?: string): Promise<void> {
    const taskId = targetTaskId ?? ui.taskId;
    if (!taskId) return;
    notifyGateError(await confirmShell(taskId, approved));
    ui.shellGateVisible = false;
    ui.shellGateCommands = [];
  }

  async function onConfirmManualShell(done: boolean, targetTaskId?: string): Promise<void> {
    const taskId = targetTaskId ?? ui.taskId;
    if (!taskId) return;
    notifyGateError(await confirmManualShell(taskId, done));
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
    onDecidePhaseGate,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
  };
}
