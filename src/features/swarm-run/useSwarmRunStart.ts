import { nextTick } from "vue";
import type { useUxStore } from "@/shared/store/ux";
import type { useI18n } from "@/shared/lib/i18n";
import { cancelTask } from "@/shared/api/endpoints/tasks-runtime";
import {
  agentConfigErrorMessage,
  type RunSwarmChatSettings,
} from "@/shared/lib/agent-config";
import { runSwarmChat } from "@/shared/lib/run-swarm-chat";
import { createSwarmStreamEventHandler } from "./useSwarmRunStreamHandler";
import { tryParseGoalCommand } from "@/shared/lib/slash-commands";
import { httpPost } from "@/shared/api/http";
import type { CreateGoalPayload } from "@/entities/goal/model/goal-types";
import {
  recordRetrievalDone,
  resetRetrievalEvents as resetStreamingRagCard,
} from "@/shared/lib/streaming-rag-events";
import type { SwarmRunState } from "./useSwarmRunState";
import type { useSwarmRunTickHandler } from "./useSwarmRunTickHandler";
import type { useSwarmRunPreflight } from "./useSwarmRunPreflight";

export interface SwarmRunStartDeps {
  state: SwarmRunState;
  tickHandler: ReturnType<typeof useSwarmRunTickHandler>;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
  ux: ReturnType<typeof useUxStore>;
  t: ReturnType<typeof useI18n>["t"];
  preflight: ReturnType<typeof useSwarmRunPreflight>;
}

export function useSwarmRunStart(deps: SwarmRunStartDeps) {
  const { state, tickHandler, sendWsSubscribe, settings, ux, t, preflight } = deps;
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
  const { resolveScenario, surfacePreflightFailure } = preflight;

  async function onStartRun(): Promise<void> {
    const goalCommand = tryParseGoalCommand(settings.form.prompt ?? "");
    if (goalCommand) {
      await onCreateGoalFromCommand(goalCommand);
      return;
    }
    currentPipelineSteps.value = [];
    lastNotifiedError.value = null;
    agentConfigErrorMessage.value = null;
    runBootstrapPending.value = true;
    ui.persistActiveTask(null, projectsStore.currentId);
    ui.resetTaskView();
    resetStreamingRagCard();
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
      await runSwarmChat(
        settings,
        {
          onTaskId: (taskId, pipelineSteps) => {
            runBootstrapPending.value = false;
            ui.taskId = taskId;
            ui.persistActiveTask(taskId, projectsStore.currentId);
            taskStore.setTaskId(taskId);
            sendWsSubscribe();
            ui.pushHistory(
              {
                prompt: settings.form.prompt,
                agent_config: null,
                pipeline_steps: pipelineSteps,
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
          onEvent: createSwarmStreamEventHandler({
            notify: (message, level, durationMs) =>
              ux.notify(message, level, durationMs),
            markTaskFailed: (detail) => {
              ui.taskError = detail;
              ui.taskStatus = "failed";
            },
            autoApprovedMessage: (step, rule) =>
              `${t("toast.autoApproved", { step })}${rule ? ` (${rule})` : ""}`,
            applyOrchestratorEvent,
            recordRetrievalDone,
          }),
        },
        { resolveScenario },
      );
      if (!ui.taskId) {
        surfacePreflightFailure();
      }
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

  return { onStartRun, onStopRun };
}
