import { defineStore } from "pinia";
import { createGateRefs, resetGateRefs } from "./_ui_gates";
import {
  createTaskRefs,
  persistActiveTask,
  restoreActiveTask,
  resetTaskRefs,
} from "./_ui_task";
import { createHistoryRefs } from "./_ui_history";

export type { HistoryEntry } from "./_ui_history";
export type { HostMetrics, HostMetricsSample } from "./_ui_task";
export { HOST_METRICS_HISTORY_MAX } from "./_ui_task";

export const useUiStore = defineStore("ui", () => {
  const taskParts = createTaskRefs();
  const gateParts = createGateRefs();
  const historyParts = createHistoryRefs();

  function resetTaskView(): void {
    resetTaskRefs(taskParts);
    resetGateRefs(gateParts);
  }

  return {
    taskId: taskParts.taskId,
    taskStatus: taskParts.taskStatus,
    taskError: taskParts.taskError,
    taskHistory: taskParts.taskHistory,
    taskAgents: taskParts.taskAgents,
    taskScenarioId: taskParts.taskScenarioId,
    taskScenarioTitle: taskParts.taskScenarioTitle,
    taskScenarioCategory: taskParts.taskScenarioCategory,
    eventsViewMode: historyParts.eventsViewMode,
    capabilities: taskParts.capabilities,
    hostMetrics: taskParts.hostMetrics,
    hostMetricsHistory: taskParts.hostMetricsHistory,
    pushHostMetricsSample: taskParts.pushHostMetricsSample,
    clearHostMetricsHistory: taskParts.clearHostMetricsHistory,
    humanGateVisible: gateParts.humanGateVisible,
    humanGateTitle: gateParts.humanGateTitle,
    humanGateFeedback: gateParts.humanGateFeedback,
    humanGateSubmitting: gateParts.humanGateSubmitting,
    shellGateVisible: gateParts.shellGateVisible,
    shellGateCommands: gateParts.shellGateCommands,
    shellGateNeedsAllowlist: gateParts.shellGateNeedsAllowlist,
    shellGateAlreadyAllowed: gateParts.shellGateAlreadyAllowed,
    manualShellGateVisible: gateParts.manualShellGateVisible,
    manualShellCommands: gateParts.manualShellCommands,
    manualShellReason: gateParts.manualShellReason,
    retryGateVisible: gateParts.retryGateVisible,
    retryFailedStep: gateParts.retryFailedStep,
    artifactPath: taskParts.artifactPath,
    taskPipelinePlan: taskParts.taskPipelinePlan,
    historyList: historyParts.historyList,
    loadHistory: historyParts.loadHistory,
    pushHistory: historyParts.pushHistory,
    updateHistoryResult: historyParts.updateHistoryResult,
    clearHistory: historyParts.clearHistory,
    persistActiveTask,
    restoreActiveTask,
    loadEventsView: historyParts.loadEventsView,
    saveEventsView: historyParts.saveEventsView,
    resetTaskView,
    activeStep: taskParts.activeStep,
    contextMode: taskParts.contextMode,
    toolsEnabled: taskParts.toolsEnabled,
    mcpPhase: taskParts.mcpPhase,
    pendingApprovals: taskParts.pendingApprovals,
    retryingSteps: taskParts.retryingSteps,
    orchestratorCompletedSteps: taskParts.orchestratorCompletedSteps,
    verificationRunning: taskParts.verificationRunning,
    blockedReason: gateParts.blockedReason,
    blockedCode: gateParts.blockedCode,
    blockedStep: gateParts.blockedStep,
  };
});
