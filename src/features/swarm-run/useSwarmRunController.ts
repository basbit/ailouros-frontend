/**
 * useSwarmRunController — run-lifecycle logic extracted from SwarmUiPage.
 * Handles start, stop, human-resume, retry, WS tick processing, and server sync.
 */
import { useUiStore } from "@/shared/store/ui";
import { useTaskStore } from "@/shared/store/task";
import { useProjectsStore } from "@/shared/store/projects";
import { useWs } from "@/shared/lib/use-ws";
import { apiUrl } from "@/shared/api/base";
import { hydrateTaskFromServer } from "@/shared/lib/hydrate-task";
import { runSwarmChat, type ChatStreamEvent } from "@/features/chat/useChat";
import {
  submitHumanResume,
  confirmShell,
  confirmHuman,
  confirmManualShell,
  fetchPendingHuman,
  fetchPendingShellCommands,
  fetchPendingManualShell,
  fetchFailedStep,
  submitRetry,
  submitContinuePipeline,
  fetchCurrentPipelineSteps,
} from "@/features/task-gate/useTaskGates";
import { getTaskPipelinePlan } from "@/shared/api/endpoints/pipeline";
import type { useSettings } from "@/features/project-settings/useSettings";
import { computed, nextTick, ref } from "vue";
import { isTaskActive } from "@/shared/lib/task-status";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";

type SettingsRef = ReturnType<typeof useSettings>;

export function useSwarmRunController(settings: SettingsRef) {
  const ui = useUiStore();
  const taskStore = useTaskStore();
  const projectsStore = useProjectsStore();
  const ux = useUxStore();
  const { t } = useI18n();

  const currentPipelineSteps = ref<string[]>([]);
  const lastNotifiedError = ref<string | null>(null);
  const runBootstrapPending = ref(false);
  const lastPipelinePlanLoadKey = ref<string>("");
  let pipelinePlanRequestId = 0;
  const pipelinePlanInflight = new Map<string, Promise<void>>();

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

  // ── WS ────────────────────────────────────────────────────────────────────

  let wsSendSubscribeFn = () => {};

  function sendWsSubscribe(): void {
    wsSendSubscribeFn();
  }

  const { sendSubscribe } = useWs({
    onOpen() {
      sendSubscribe(ui.taskId ?? undefined);
    },
    onMessage(msg) {
      if (typeof msg !== "object" || msg === null) return;
      const d = msg as Record<string, unknown>;
      if (d.type !== "tick") return;
      applyTick(d);
    },
  });

  wsSendSubscribeFn = () => sendSubscribe(ui.taskId ?? undefined);

  // ── Hydrate ───────────────────────────────────────────────────────────────

  function applyHydratedTask(
    h: NonNullable<Awaited<ReturnType<typeof hydrateTaskFromServer>>>,
  ): void {
    ui.taskHistory = h.history;
    ui.taskStatus = h.status as typeof ui.taskStatus;
    ui.taskError = h.error ?? null;
    ui.taskAgents = h.agents;
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

  async function syncTaskFromServer(tid: string): Promise<void> {
    const h = await hydrateTaskFromServer(tid);
    if (h) applyHydratedTask(h);
    await loadPipelinePlan(tid, "sync");
  }

  async function loadPipelinePlan(tid: string, reason = "default"): Promise<void> {
    if (!tid) return;
    const loadKey = `${tid}:${reason}`;
    if (lastPipelinePlanLoadKey.value === loadKey) return;
    const existing = pipelinePlanInflight.get(tid);
    if (existing) {
      await existing;
      return;
    }
    const requestId = ++pipelinePlanRequestId;
    const promise = getTaskPipelinePlan(tid)
      .then((plan) => {
        if (requestId !== pipelinePlanRequestId || ui.taskId !== tid) return;
        ui.taskPipelinePlan = plan;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .catch(() => {
        if (requestId !== pipelinePlanRequestId || ui.taskId !== tid) return;
        ui.taskPipelinePlan = null;
        lastPipelinePlanLoadKey.value = loadKey;
      })
      .finally(() => {
        pipelinePlanInflight.delete(tid);
      });
    pipelinePlanInflight.set(tid, promise);
    await promise;
  }

  function updateRunHistory(status: string | null, error: unknown): void {
    const tid = ui.taskId?.trim();
    if (!tid) return;
    const historyStatus = (status ?? null) as
      | "pending"
      | "running"
      | "in_progress"
      | "completed"
      | "failed"
      | "awaiting_human"
      | "awaiting_shell_confirm"
      | "cancelled"
      | null;
    const entry = ui.historyList.find((item) => (item.taskId ?? "").trim() === tid);
    const startedAt = entry?.startedAt ?? entry?.at ?? Date.now();
    const finishedAt =
      status === "completed" || status === "failed" || status === "cancelled"
        ? Date.now()
        : null;
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
  }

  // ── Tick processor ────────────────────────────────────────────────────────

  function applyTick(d: Record<string, unknown>): void {
    if (d.capabilities) {
      ui.capabilities = d.capabilities as {
        workspace_write?: boolean;
        command_exec?: boolean;
      };
    }
    if (d.metrics) {
      ui.hostMetrics = d.metrics as typeof ui.hostMetrics;
    }

    if (!ui.taskId) {
      // During the short optimistic-start window we intentionally show the
      // run as active before the backend returns X-Task-Id. The WS channel
      // still emits idle ticks (`task: null`) in that gap; do not let them
      // reset the UI back to idle or the Start button will flicker/stick.
      if (runBootstrapPending.value) return;
      ui.resetTaskView();
      taskStore.resetTask();
      return;
    }

    const j = d.task as Record<string, unknown> | undefined;
    if (!j) return;

    const status = j.status as string | null;
    ui.taskStatus = status as typeof ui.taskStatus;
    ui.taskError = j.error ?? null;

    if (status === "awaiting_human" && ui.taskId) {
      ui.humanGateVisible = true;
      ui.shellGateVisible = false;
      ui.retryGateVisible = false;
      const hist =
        (j.history as { agent?: string; message?: string }[] | undefined) ?? [];
      const last = hist[hist.length - 1];
      const msg = last?.message ? String(last.message) : "";
      if (msg.includes("NEEDS_CLARIFICATION")) {
        ui.humanGateTitle = t("humanGate.clarificationRequired");
      } else {
        ui.humanGateTitle = `${t("humanGate.awaitingReviewInput")} ${msg.slice(0, 500)}`;
      }
      void loadPipelinePlan(ui.taskId, `awaiting_human:${String(j.mcp_phase || "")}`);
    } else if (status === "awaiting_shell_confirm" && ui.taskId) {
      ui.shellGateVisible = true;
      ui.humanGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
      void fetchPendingShellCommands(ui.taskId).then((payload) => {
        ui.shellGateCommands = payload.commands;
        ui.shellGateNeedsAllowlist = payload.needs_allowlist;
        ui.shellGateAlreadyAllowed = payload.already_allowed;
      });
    } else if (status === "awaiting_manual_shell" && ui.taskId) {
      ui.manualShellGateVisible = true;
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.retryGateVisible = false;
      void fetchPendingManualShell(ui.taskId).then((payload) => {
        ui.manualShellCommands = payload.commands;
        ui.manualShellReason = payload.reason;
      });
    } else if (status === "failed" && ui.taskId) {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = true;
      const tid = ui.taskId;
      void fetchFailedStep(tid).then((step) => {
        ui.retryFailedStep = step;
      });
      void fetchCurrentPipelineSteps(tid).then((steps) => {
        currentPipelineSteps.value = steps;
      });
      void loadPipelinePlan(ui.taskId, "failed");
      ui.persistActiveTask(null, projectsStore.currentId);
    } else if (status === "completed") {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
      ui.persistActiveTask(null, projectsStore.currentId);
      if (ui.taskId) void loadPipelinePlan(ui.taskId, "completed");
    } else if (status === "running" || status === "in_progress") {
      ui.humanGateVisible = false;
      ui.shellGateVisible = false;
      ui.manualShellGateVisible = false;
      ui.retryGateVisible = false;
    }

    if (j.error) {
      updateRunHistory(status, j.error);
      const errorText = String(j.error);
      if (lastNotifiedError.value !== errorText) {
        ux.notify(`${t("toast.runError")}: ${errorText}`, "error", 4200);
        lastNotifiedError.value = errorText;
      }
      taskStore.setTask({
        status: status as Parameters<typeof taskStore.setTask>[0]["status"],
        error: j.error,
        history: ui.taskHistory,
        agents: ui.taskAgents,
      });
      return;
    }

    const history =
      (j.history as
        | { agent?: string; message?: string; timestamp?: string }[]
        | undefined) ?? [];
    ui.taskHistory = history;
    ui.taskAgents = (j.agents as string[] | undefined) ?? [];

    const agents = ui.taskAgents;
    if (agents.length) ui.activeStep = agents[agents.length - 1];
    if (j.context_mode) ui.contextMode = String(j.context_mode);
    if (typeof j.tools_enabled === "boolean") ui.toolsEnabled = j.tools_enabled;
    if (j.mcp_phase) ui.mcpPhase = String(j.mcp_phase);
    ui.pendingApprovals =
      status === "awaiting_human" ||
      status === "awaiting_shell_confirm" ||
      status === "awaiting_manual_shell"
        ? 1
        : 0;

    ui.artifactPath = ui.taskId
      ? apiUrl("/artifacts/" + ui.taskId + "/pipeline.json")
      : null;
    updateRunHistory(status, j.error);
    if (!j.error) {
      lastNotifiedError.value = null;
    }

    taskStore.setTask({
      task_id: ui.taskId ?? undefined,
      status: status as Parameters<typeof taskStore.setTask>[0]["status"],
      error: j.error,
      history: history,
      agents: ui.taskAgents,
    });
  }

  // ── Run actions ───────────────────────────────────────────────────────────

  async function onStartRun(): Promise<void> {
    currentPipelineSteps.value = [];
    lastNotifiedError.value = null;
    runBootstrapPending.value = true;
    ui.persistActiveTask(null, projectsStore.currentId);
    ui.resetTaskView();
    lastPipelinePlanLoadKey.value = "";
    taskStore.resetTask();
    sendWsSubscribe();
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
      await fetch(apiUrl(`/v1/tasks/${tid}/cancel`), { method: "POST" });
    } catch {
      // ignore network error — task may already be done
    }
    ui.taskStatus = "cancelled";
  }

  async function onHumanResume(): Promise<void> {
    if (!ui.taskId) return;
    const taskId = ui.taskId;
    const feedback = ui.humanGateFeedback;
    ui.humanGateFeedback = "";
    ui.humanGateVisible = false;

    // Try new blocking confirm-human first (BUG-1 fix: pipeline thread is waiting)
    const pending = await fetchPendingHuman(taskId);
    if (pending?.pending) {
      await confirmHuman(taskId, true, feedback);
      return;
    }
    // Fallback to old human-resume (stop-and-restart pattern)
    await submitHumanResume(taskId, feedback, sendWsSubscribe);
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
    ui,
    isRunning,
    currentPipelineSteps,
    sendWsSubscribe,
    syncTaskFromServer,
    applyTick,
    onStartRun,
    onStopRun,
    onHumanResume,
    onConfirmShell,
    onConfirmManualShell,
    onRetry,
    onContinuePipeline,
  };
}
