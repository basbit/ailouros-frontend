import { nextTick } from "vue";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { cancelTask } from "@/shared/api/endpoints/tasks-runtime";
import { type RunSwarmChatSettings } from "@/shared/lib/agent-config";
import { type ChatStreamEvent } from "@/shared/lib/chat-stream-events";
import { runSwarmChat } from "@/shared/lib/run-swarm-chat";
import { tryParseGoalCommand } from "@/shared/lib/slash-commands";
import { httpPost } from "@/shared/api/http";
import type { CreateGoalPayload } from "@/entities/goal/model/goal-types";
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
    const goalCommand = tryParseGoalCommand(settings.form.prompt ?? "");
    if (goalCommand) {
      await onCreateGoalFromCommand(goalCommand);
      return;
    }
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
    ui.taskStatus = "running";
    await nextTick();
    await waitForUiPaint();

    try {
      await runSwarmChat(settings, {
        onTaskId: (taskId) => {
          runBootstrapPending.value = false;
          ui.taskId = taskId;
          ui.persistActiveTask(taskId, projectsStore.currentId);
          taskStore.setTaskId(taskId);
          sendWsSubscribe();
          ui.pushHistory(
            {
              prompt: settings.form.prompt,
              agent_config: null,
              pipeline_steps: settings.pipelineState.collectStepIds(),
              taskId: taskId,
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
        onDone: () => undefined,
        sendWsSubscribe,
        onEvent: (event: ChatStreamEvent) => {
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
      });
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

  async function onCreateGoalFromCommand(
    command: ReturnType<typeof tryParseGoalCommand>,
  ): Promise<void> {
    if (command === null) return;
    const workspaceRoot = (settings.form.workspace_root ?? "").trim();
    if (!workspaceRoot) {
      ux.notify(t("slashCommand.goal.needsWorkspace"), "warning", 4000);
      return;
    }
    try {
      const payload: CreateGoalPayload = {
        title: command.title,
        description: command.description,
        success_criteria: command.successCriteria.length
          ? command.successCriteria
          : [command.title],
        workspace_root: workspaceRoot,
      };
      const created = await httpPost<{ id: string }>("/v1/goals", payload);
      if (command.schedule && created?.id) {
        await applyGoalSchedule(created.id, command.schedule);
      }
      ux.notify(t("slashCommand.goal.created", { title: command.title }), "info", 3500);
      settings.form.prompt = "";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ux.notify(t("slashCommand.goal.failed", { error: message }), "error", 5000);
    }
  }

  async function applyGoalSchedule(
    goalId: string,
    schedule: NonNullable<ReturnType<typeof tryParseGoalCommand>>["schedule"],
  ): Promise<void> {
    if (!schedule) return;
    const body =
      schedule.mode === "cron"
        ? { cron: schedule.cron }
        : { natural_language: schedule.naturalLanguage };
    await httpPost(`/v1/goals/${encodeURIComponent(goalId)}/schedule`, body);
  }

  async function onStopRun(): Promise<void> {
    const taskId = ui.taskId;
    if (!taskId) return;
    try {
      await cancelTask(taskId);
    } catch {
      // ignore network error — task may already be done
    }
    ui.taskStatus = "cancelled";
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
      if (pending?.pending) {
        await confirmHuman(taskId, true, effectiveFeedback);
      } else {
        await submitHumanResume(taskId, effectiveFeedback, sendWsSubscribe, (event) => {
          if (event.kind === "orchestrator") applyOrchestratorEvent(event);
        });
      }
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
