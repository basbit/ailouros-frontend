/**
 * useSwarmRunState — shared run-lifecycle refs, hydration, and history bookkeeping.
 * Extracted from useSwarmRunController.ts (plan §20.1.4) — no behaviour change.
 */
import { computed, ref } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useProjectsStore } from "@/shared/store/projects";
import { isTaskActive } from "@/shared/lib/task-status";
import { hydrateTaskFromServer } from "@/shared/lib/hydrate-task";

export type SwarmRunState = ReturnType<typeof useSwarmRunState>;

export function useSwarmRunState() {
  const ui = useUiStore();
  const taskStore = useTaskStore();
  const projectsStore = useProjectsStore();

  const currentPipelineSteps = ref<string[]>([]);
  const lastNotifiedError = ref<string | null>(null);
  const runBootstrapPending = ref(false);
  const lastPipelinePlanLoadKey = ref<string>("");

  const isRunning = computed(() => isTaskActive(ui.taskStatus ?? ""));

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

  function applyHydratedTask(
    h: NonNullable<Awaited<ReturnType<typeof hydrateTaskFromServer>>>,
  ): void {
    ui.taskHistory = h.history;
    ui.taskStatus = h.status as typeof ui.taskStatus;
    ui.taskError = h.error ?? null;
    ui.taskAgents = h.agents;
    ui.taskScenarioId = h.scenarioId;
    ui.taskScenarioTitle = h.scenarioTitle;
    ui.taskScenarioCategory = h.scenarioCategory;
    ui.activeStep = h.agents.length ? h.agents[h.agents.length - 1] : null;
    ui.artifactPath = h.artifactPath;
    if (h.fromLogFallback) {
      ui.eventsViewMode = "raw";
      ui.saveEventsView(projectsStore.currentId);
    }
    if (!isTaskActive(h.status ?? "")) {
      ui.contextMode = null;
      ui.mcpPhase = null;
      ui.pendingApprovals = 0;
    }
    taskStore.setTask({
      task_id: h.taskId,
      status: h.status as Parameters<typeof taskStore.setTask>[0]["status"],
      error: h.error,
      history: h.history,
      agents: h.agents,
    });
  }

  function updateRunHistory(status: string | null, error: unknown): void {
    const tid = ui.taskId?.trim();
    if (!tid) return;
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
    const entry = ui.historyList.find((item) => (item.taskId ?? "").trim() === tid);
    const startedAt = entry?.startedAt ?? entry?.at ?? Date.now();
    const isTerminal =
      status === "completed" ||
      status === "completed_no_writes" ||
      status === "completed_with_failures" ||
      status === "failed" ||
      status === "blocked" ||
      status === "cancelled";
    const finishedAt = isTerminal ? Date.now() : null;
    ui.updateHistoryResult(
      tid,
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
      void emitTerminalDesktopNotification(historyStatus, tid, error);
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
