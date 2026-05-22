import { useUiStore } from "@/shared/store/ui";
import type { OrchestratorStreamEvent } from "@/shared/lib/chat-stream-events";

type UiStore = ReturnType<typeof useUiStore>;

function applyRunStarted(ui: UiStore): void {
  ui.taskStatus = "in_progress";
  ui.activeStep = null;
  ui.blockedReason = null;
  ui.blockedCode = null;
  ui.blockedStep = null;
  ui.retryingSteps = new Set();
  ui.orchestratorCompletedSteps = new Set();
  ui.verificationRunning = false;
  ui.clearHostMetricsHistory();
}

function applyStepStarted(ui: UiStore, stepId: string | null): void {
  if (!stepId) return;
  ui.activeStep = stepId;
  const retrying = new Set(ui.retryingSteps);
  retrying.delete(stepId);
  ui.retryingSteps = retrying;
}

function applyStepCompleted(ui: UiStore, stepId: string | null): void {
  if (!stepId) return;
  const completed = new Set(ui.orchestratorCompletedSteps);
  completed.add(stepId);
  ui.orchestratorCompletedSteps = completed;
  const retrying = new Set(ui.retryingSteps);
  retrying.delete(stepId);
  ui.retryingSteps = retrying;
}

function applyStepRetryStarted(ui: UiStore, stepId: string | null): void {
  if (!stepId) return;
  ui.activeStep = stepId;
  const retrying = new Set(ui.retryingSteps);
  retrying.add(stepId);
  ui.retryingSteps = retrying;
}

function applyPipelineBlocked(
  ui: UiStore,
  orchestratorEvent: OrchestratorStreamEvent,
): void {
  ui.taskStatus = "blocked";
  ui.blockedReason = orchestratorEvent.reason ?? orchestratorEvent.message;
  ui.blockedCode = orchestratorEvent.code ?? null;
  ui.blockedStep = orchestratorEvent.step ?? null;
  ui.activeStep = null;
  ui.verificationRunning = false;
}

export function applyOrchestratorEvent(
  ui: UiStore,
  orchestratorEvent: OrchestratorStreamEvent,
): void {
  switch (orchestratorEvent.event) {
    case "run_started":
      applyRunStarted(ui);
      return;
    case "step_started":
      applyStepStarted(ui, orchestratorEvent.step);
      return;
    case "step_completed":
      applyStepCompleted(ui, orchestratorEvent.step);
      return;
    case "step_retry_started":
      applyStepRetryStarted(ui, orchestratorEvent.step);
      return;
    case "verification_layer_started":
      ui.verificationRunning = true;
      return;
    case "verification_layer_completed":
    case "final_gate_denied":
    case "run_finished":
      ui.verificationRunning = false;
      return;
    case "pipeline_blocked":
      applyPipelineBlocked(ui, orchestratorEvent);
      return;
  }
}
