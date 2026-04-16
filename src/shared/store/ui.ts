/**
 * UI store — app-level reactive state that crosses feature boundaries.
 * Replaces the global `state` object and scattered document.getElementById calls.
 */
import { defineStore } from "pinia";
import { ref } from "vue";
import type { TaskStatus } from "@/entities/task/model/types";
import type { PipelinePlanSnapshot } from "@/shared/api/endpoints/pipeline";
import {
  LS_ACTIVE_TASK,
  LS_EVENTS_VIEW,
  LS_HISTORY,
  HISTORY_LIMIT,
} from "@/shared/lib/swarm-constants";

export interface HistoryEntry {
  id: string;
  at: number;
  prompt: string;
  agent_config: unknown;
  pipeline_steps: string[];
  taskId: string | null;
  workspace_root?: string | null;
  project_context_file?: string | null;
  workspace_write?: boolean;
  status?: TaskStatus | null;
  error?: string | null;
  startedAt?: number | null;
  finishedAt?: number | null;
  durationMs?: number | null;
}

export interface ServerCapabilities {
  workspace_write?: boolean;
  command_exec?: boolean;
}

export interface HostMetrics {
  cpu_percent?: number;
  memory_percent?: number;
  memory_used_gb?: number;
  loadavg?: number[];
  error?: string;
}

export const useUiStore = defineStore("ui", () => {
  const taskId = ref<string | null>(null);
  const taskStatus = ref<TaskStatus | null>(null);
  const taskError = ref<unknown>(null);
  const taskHistory = ref<
    {
      id?: string;
      agent?: string;
      message?: string;
      timestamp?: string;
      status?: string;
    }[]
  >([]);
  const taskAgents = ref<string[]>([]);

  const eventsViewMode = ref<"preview" | "raw">("preview");
  const capabilities = ref<ServerCapabilities | null>(null);
  const hostMetrics = ref<HostMetrics | null>(null);

  const humanGateVisible = ref(false);
  const humanGateTitle = ref("Awaiting operator input");
  const humanGateFeedback = ref("");

  const shellGateVisible = ref(false);
  const shellGateCommands = ref<string[]>([]);
  const shellGateNeedsAllowlist = ref<string[]>([]);
  const shellGateAlreadyAllowed = ref<string[]>([]);

  // Manual-execution gate: orchestrator refuses to run a command (sudo etc.)
  // and asks the user to run it themselves in their own terminal.
  const manualShellGateVisible = ref(false);
  const manualShellCommands = ref<string[]>([]);
  const manualShellReason = ref("");

  const retryGateVisible = ref(false);
  const retryFailedStep = ref("(unknown)");

  const artifactPath = ref<string | null>(null);
  const taskPipelinePlan = ref<PipelinePlanSnapshot | null>(null);

  const historyList = ref<HistoryEntry[]>([]);

  // Statusline fields (F-4)
  const activeStep = ref<string | null>(null);
  const contextMode = ref<string | null>(null);
  const toolsEnabled = ref<boolean>(true);
  const mcpPhase = ref<string | null>(null);
  const pendingApprovals = ref<number>(0);

  // ── Project-scoped keys ────────────────────────────────────────────────────

  function _historyKey(pid: string) {
    return LS_HISTORY + "_" + pid;
  }
  function _activeTaskKey(pid: string) {
    return LS_ACTIVE_TASK + "_" + pid;
  }
  function _eventsViewKey(pid: string) {
    return LS_EVENTS_VIEW + "_" + pid;
  }

  // ── History ────────────────────────────────────────────────────────────────

  function loadHistory(pid: string): void {
    try {
      const key = _historyKey(pid);
      let raw = localStorage.getItem(key);
      if (!raw && pid === "default") {
        const leg = localStorage.getItem(LS_HISTORY);
        if (leg) {
          localStorage.setItem(key, leg);
          raw = leg;
        }
      }
      if (!raw) {
        historyList.value = [];
        return;
      }
      const arr = JSON.parse(raw);
      historyList.value = Array.isArray(arr) ? arr : [];
    } catch {
      historyList.value = [];
    }
  }

  function pushHistory(entry: Omit<HistoryEntry, "id" | "at">, pid: string): void {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random();
    const full: HistoryEntry = { id, at: Date.now(), ...entry };
    historyList.value.unshift(full);
    if (historyList.value.length > HISTORY_LIMIT) {
      historyList.value = historyList.value.slice(0, HISTORY_LIMIT);
    }
    try {
      localStorage.setItem(_historyKey(pid), JSON.stringify(historyList.value));
    } catch {
      /* quota */
    }
  }

  function updateHistoryResult(
    taskIdToUpdate: string,
    patch: Partial<HistoryEntry>,
    pid: string,
  ): void {
    const next = historyList.value.map((entry) => {
      if ((entry.taskId ?? "").trim() !== taskIdToUpdate.trim()) return entry;
      return { ...entry, ...patch };
    });
    historyList.value = next;
    try {
      localStorage.setItem(_historyKey(pid), JSON.stringify(historyList.value));
    } catch {
      /* ignore */
    }
  }

  function clearHistory(pid: string): void {
    historyList.value = [];
    try {
      localStorage.removeItem(_historyKey(pid));
    } catch {
      /* ignore */
    }
  }

  // ── Active task persistence ────────────────────────────────────────────────

  function persistActiveTask(tid: string | null, pid: string): void {
    if (!tid) {
      try {
        localStorage.removeItem(_activeTaskKey(pid));
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.setItem(_activeTaskKey(pid), JSON.stringify({ taskId: tid }));
      } catch {
        /* quota */
      }
    }
  }

  function restoreActiveTask(pid: string): string | null {
    try {
      const key = _activeTaskKey(pid);
      let raw = localStorage.getItem(key);
      if (!raw && pid === "default") {
        const leg = localStorage.getItem(LS_ACTIVE_TASK);
        if (leg) {
          localStorage.setItem(key, leg);
          raw = leg;
        }
      }
      if (!raw) return null;
      const j = JSON.parse(raw);
      return j && j.taskId ? String(j.taskId).trim() : null;
    } catch {
      return null;
    }
  }

  // ── Events view mode ───────────────────────────────────────────────────────

  function loadEventsView(pid: string): void {
    try {
      const key = _eventsViewKey(pid);
      let v = localStorage.getItem(key);
      if (v == null && pid === "default") {
        const leg = localStorage.getItem(LS_EVENTS_VIEW);
        if (leg != null) {
          localStorage.setItem(key, leg);
          v = leg;
        }
      }
      eventsViewMode.value = v === "raw" ? "raw" : "preview";
    } catch {
      /* ignore */
    }
  }

  function saveEventsView(pid: string): void {
    try {
      localStorage.setItem(_eventsViewKey(pid), eventsViewMode.value);
    } catch {
      /* ignore */
    }
  }

  function resetTaskView(): void {
    taskId.value = null;
    taskStatus.value = null;
    taskError.value = null;
    taskHistory.value = [];
    taskAgents.value = [];
    humanGateVisible.value = false;
    humanGateTitle.value = "Awaiting operator input";
    humanGateFeedback.value = "";
    shellGateVisible.value = false;
    shellGateCommands.value = [];
    shellGateNeedsAllowlist.value = [];
    shellGateAlreadyAllowed.value = [];
    manualShellGateVisible.value = false;
    manualShellCommands.value = [];
    manualShellReason.value = "";
    retryGateVisible.value = false;
    retryFailedStep.value = "(unknown)";
    artifactPath.value = null;
    taskPipelinePlan.value = null;
    activeStep.value = null;
    contextMode.value = null;
    toolsEnabled.value = true;
    mcpPhase.value = null;
    pendingApprovals.value = 0;
  }

  return {
    taskId,
    taskStatus,
    taskError,
    taskHistory,
    taskAgents,
    eventsViewMode,
    capabilities,
    hostMetrics,
    humanGateVisible,
    humanGateTitle,
    humanGateFeedback,
    shellGateVisible,
    shellGateCommands,
    shellGateNeedsAllowlist,
    shellGateAlreadyAllowed,
    manualShellGateVisible,
    manualShellCommands,
    manualShellReason,
    retryGateVisible,
    retryFailedStep,
    artifactPath,
    taskPipelinePlan,
    historyList,
    loadHistory,
    pushHistory,
    updateHistoryResult,
    clearHistory,
    persistActiveTask,
    restoreActiveTask,
    loadEventsView,
    saveEventsView,
    resetTaskView,
    // Statusline (F-4)
    activeStep,
    contextMode,
    toolsEnabled,
    mcpPhase,
    pendingApprovals,
  };
});
