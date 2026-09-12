import type { useUxStore } from "@/shared/store/ux";
import type { RunSwarmChatSettings } from "@/entities/agent-config";
import { useI18n } from "@/shared/lib/i18n";
import { submitForkAndRun } from "./fork-run-actions";
import type { SwarmRunState } from "./useSwarmRunState";

export interface SwarmRunForkActionDeps {
  state: SwarmRunState;
  sendWsSubscribe: () => void;
  settings: RunSwarmChatSettings;
  ux: ReturnType<typeof useUxStore>;
}

export function useSwarmRunForkAction(deps: SwarmRunForkActionDeps) {
  const { state, sendWsSubscribe, settings, ux } = deps;
  const { ui, taskStore, projectsStore, currentPipelineSteps } = state;
  const { t } = useI18n();

  function parentPrompt(parentTaskId: string): string {
    const entry = ui.historyList.find(
      (candidate) => candidate.taskId === parentTaskId,
    );
    return entry?.prompt ?? settings.form.prompt ?? "";
  }

  function adoptFork(parentTaskId: string, stepId: string, forkedTaskId: string): void {
    ui.taskId = forkedTaskId;
    ui.persistActiveTask(forkedTaskId, projectsStore.currentId);
    ui.trackRun(forkedTaskId);
    taskStore.setTaskId(forkedTaskId);
    ui.pushHistory(
      {
        prompt: parentPrompt(parentTaskId),
        agent_config: null,
        pipeline_steps: [...currentPipelineSteps.value],
        taskId: forkedTaskId,
        workspace_root: settings.form.workspace_root || null,
        project_context_file: settings.form.project_context_file || null,
        workspace_write: settings.form.workspace_write,
        status: "running",
        startedAt: Date.now(),
        parentTaskId,
        forkedFromStep: stepId,
      },
      projectsStore.currentId,
    );
    sendWsSubscribe();
    ux.notify(t("stepFork.created", { taskId: forkedTaskId }), "success");
  }

  /**
   * `onForked` fires when the branch exists, long before this promise settles:
   * the re-run streams inside the fork-run response, so a caller that waited
   * for the promise would stay on the parent run for the whole run.
   */
  async function onForkStep(
    parentTaskId: string,
    stepId: string,
    instruction?: string | null,
    onForked?: (forkedTaskId: string) => void,
  ): Promise<string | null> {
    let forkedTaskId: string | null = null;
    const result = await submitForkAndRun(
      {
        parentTaskId,
        stepId,
        pipelineSteps: currentPipelineSteps.value,
        settings,
        instruction,
      },
      (id) => {
        forkedTaskId = id;
        adoptFork(parentTaskId, stepId, id);
        onForked?.(id);
      },
    );
    if (!result.ok && result.error) {
      ux.notify(t("stepFork.failed", { error: result.error }), "error", 4200);
    }
    return forkedTaskId;
  }

  return { onForkStep };
}
