import { computed, ref } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useProjectsStore } from "@/entities/project";
import { isTaskActive } from "@/shared/lib/task-status";
import type { HydrateResult } from "@/shared/lib/hydrate-task";

export type SwarmRunState = ReturnType<typeof useSwarmRunState>;

export function useSwarmRunState() {
  const ui = useUiStore();
  const taskStore = useTaskStore();
  const projectsStore = useProjectsStore();

  const currentPipelineSteps = ref<string[]>([]);
  const lastNotifiedError = ref<string | null>(null);
  const runBootstrapPending = ref(false);
  const lastPipelinePlanLoadKey = ref<string>("");

  const isRunning = computed(() => {
    if (ui.runAvailability === "unavailable") return false;
    return isTaskActive(ui.taskStatus ?? "");
  });

  function waitForUiPaint(): Promise<void> {
    return new Promise((resolve) => {
      if (
        typeof window === "undefined" ||
        typeof window.requestAnimationFrame !== "function"
      ) {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => resolve());
    });
  }

  function applyHydratedTask(task: HydrateResult): void {
    ui.taskHistory = task.history;
    ui.taskStatus = task.status as typeof ui.taskStatus;
    ui.taskError = task.error ?? null;
    ui.taskAgents = task.agents;
    ui.taskScenarioId = task.scenarioId;
    ui.taskScenarioTitle = task.scenarioTitle;
    ui.taskScenarioCategory = task.scenarioCategory;
    ui.activeStep = task.agents.length ? task.agents[task.agents.length - 1] : null;
    ui.artifactPath = task.artifactPath;
    if (!isTaskActive(task.status ?? "")) {
      ui.contextMode = null;
      ui.mcpPhase = null;
      ui.pendingApprovals = 0;
    }
    taskStore.setTask({
      task_id: task.taskId,
      status: task.status as Parameters<typeof taskStore.setTask>[0]["status"],
      error: task.error,
      history: task.history,
      agents: task.agents,
    });
  }

  function updateRunHistory(status: string | null, error: unknown): void {
    const taskId = ui.taskId?.trim();
    if (!taskId) return;
    const historyStatus = (status ?? null) as
      | "pending"
      | "running"
      | "in_progress"
      | "completed"
      | "completed_no_writes"
      | "completed_with_failures"
      | "failed"
      | "blocked"
      | "awaiting_human"
      | "awaiting_shell_confirm"
      | "awaiting_manual_shell"
      | "cancelled"
      | null;
    const entry = ui.historyList.find((item) => (item.taskId ?? "").trim() === taskId);
    const startedAt = entry?.startedAt ?? entry?.at ?? Date.now();
    const isTerminal =
      status === "completed" ||
      status === "completed_no_writes" ||
      status === "completed_with_failures" ||
      status === "failed" ||
      status === "blocked" ||
      status === "cancelled";
    const alreadyRecordedFinishedAt = entry?.finishedAt ?? null;
    const finishedAt = isTerminal ? (alreadyRecordedFinishedAt ?? Date.now()) : null;
    ui.updateHistoryResult(
      taskId,
      {
        status: historyStatus,
        error: error ? String(error) : null,
        startedAt,
        finishedAt,
        durationMs: finishedAt ? Math.max(0, finishedAt - startedAt) : null,
      },
      projectsStore.currentId,
    );
    if (isTerminal) {
      void emitTerminalDesktopNotification(historyStatus, taskId, error);
    }
  }

  async function emitTerminalDesktopNotification(
    finalStatus: string | null,
    taskId: string,
    runError: unknown,
  ): Promise<void> {
    try {
      const desktopNotifications = await import("@/shared/lib/useDesktopNotifications");
      const title =
        finalStatus === "failed" || finalStatus === "blocked"
          ? `Run ${finalStatus}`
          : `Run ${finalStatus ?? "completed"}`;
      const errorText = runError ? String(runError).slice(0, 240) : "";
      const body = `task ${taskId.slice(0, 8)}` + (errorText ? ` — ${errorText}` : "");
      await desktopNotifications.sendDesktopNotification({
        title,
        body,
        level:
          finalStatus === "failed" || finalStatus === "blocked"
            ? "error"
            : finalStatus === "completed_no_writes" ||
                finalStatus === "completed_with_failures"
              ? "warning"
              : "info",
      });
    } catch {
      /* desktop notifications are best-effort; ignore */
    }
  }

  return {
    ui,
    taskStore,
    projectsStore,
    currentPipelineSteps,
    lastNotifiedError,
    runBootstrapPending,
    lastPipelinePlanLoadKey,
    isRunning,
    waitForUiPaint,
    applyHydratedTask,
    updateRunHistory,
  };
}
