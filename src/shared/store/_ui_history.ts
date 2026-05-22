import { ref } from "vue";
import type { TaskStatus } from "@/shared/model/task-types";
import {
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

function historyKey(pid: string): string {
  return LS_HISTORY + "_" + pid;
}

function eventsViewKey(pid: string): string {
  return LS_EVENTS_VIEW + "_" + pid;
}

export function createHistoryRefs() {
  const historyList = ref<HistoryEntry[]>([]);
  const eventsViewMode = ref<"preview" | "raw">("preview");

  function loadHistory(pid: string): void {
    try {
      const key = historyKey(pid);
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
      localStorage.setItem(historyKey(pid), JSON.stringify(historyList.value));
    } catch (e) {
      void e;
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
      localStorage.setItem(historyKey(pid), JSON.stringify(historyList.value));
    } catch (e) {
      void e;
    }
  }

  function clearHistory(pid: string): void {
    historyList.value = [];
    try {
      localStorage.removeItem(historyKey(pid));
    } catch (e) {
      void e;
    }
  }

  function loadEventsView(pid: string): void {
    try {
      const key = eventsViewKey(pid);
      let v = localStorage.getItem(key);
      if (v == null && pid === "default") {
        const leg = localStorage.getItem(LS_EVENTS_VIEW);
        if (leg != null) {
          localStorage.setItem(key, leg);
          v = leg;
        }
      }
      eventsViewMode.value = v === "raw" ? "raw" : "preview";
    } catch (e) {
      void e;
    }
  }

  function saveEventsView(pid: string): void {
    try {
      localStorage.setItem(eventsViewKey(pid), eventsViewMode.value);
    } catch (e) {
      void e;
    }
  }

  return {
    historyList,
    eventsViewMode,
    loadHistory,
    pushHistory,
    updateHistoryResult,
    clearHistory,
    loadEventsView,
    saveEventsView,
  };
}
