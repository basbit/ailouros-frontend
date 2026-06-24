import { ref } from "vue";
import type { TaskStatus } from "@/shared/model/task-types";
import {
  LS_EVENTS_VIEW,
  LS_HISTORY,
  HISTORY_LIMIT,
} from "@/shared/lib/swarm-constants";
import { readRawString, writeRawString, removeKey } from "@/shared/lib/storage-utils";
import { safeWarn, parseJsonOr } from "@/shared/lib/safe-async";

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
    let raw: string | null = null;
    safeWarn("ui-history: failed to load history", () => {
      const key = historyKey(pid);
      raw = readRawString(key);
      if (!raw && pid === "default") {
        const leg = readRawString(LS_HISTORY);
        if (leg) {
          writeRawString(key, leg);
          raw = leg;
        }
      }
    });
    const arr = parseJsonOr<unknown>(raw, [], "ui-history: failed to load history");
    historyList.value = Array.isArray(arr) ? arr : [];
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
    safeWarn("ui-history: failed to persist history entry", () =>
      writeRawString(historyKey(pid), JSON.stringify(historyList.value)),
    );
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
    safeWarn("ui-history: failed to persist updated history", () =>
      writeRawString(historyKey(pid), JSON.stringify(historyList.value)),
    );
  }

  function clearHistory(pid: string): void {
    historyList.value = [];
    safeWarn("ui-history: failed to clear history from storage", () =>
      removeKey(historyKey(pid)),
    );
  }

  function loadEventsView(pid: string): void {
    safeWarn("ui-history: failed to load events view preference", () => {
      const key = eventsViewKey(pid);
      let v = readRawString(key);
      if (v == null && pid === "default") {
        const leg = readRawString(LS_EVENTS_VIEW);
        if (leg != null) {
          writeRawString(key, leg);
          v = leg;
        }
      }
      eventsViewMode.value = v === "raw" ? "raw" : "preview";
    });
  }

  function saveEventsView(pid: string): void {
    safeWarn("ui-history: failed to save events view preference", () =>
      writeRawString(eventsViewKey(pid), eventsViewMode.value),
    );
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
