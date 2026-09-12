import { ref } from "vue";
import type { TaskStatus } from "@/shared/model/task-types";
import {
  LS_EVENTS_VIEW,
  LS_HISTORY,
  HISTORY_LIMIT,
} from "@/shared/lib/swarm-ui-constants";
import {
  persistenceAdapter,
  readWithLegacyCopy,
} from "@/shared/lib/persistence-adapter";
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
  /** Set when this run is a fork: the run it branched from. */
  parentTaskId?: string | null;
  /** Set when this run is a fork: the step it branched at. */
  forkedFromStep?: string | null;
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
      raw = readWithLegacyCopy(historyKey(pid), pid === "default" ? LS_HISTORY : null);
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
      persistenceAdapter.write(historyKey(pid), JSON.stringify(historyList.value)),
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
      persistenceAdapter.write(historyKey(pid), JSON.stringify(historyList.value)),
    );
  }

  function clearHistory(pid: string): void {
    historyList.value = [];
    safeWarn("ui-history: failed to clear history from storage", () =>
      persistenceAdapter.remove(historyKey(pid)),
    );
  }

  function loadEventsView(pid: string): void {
    safeWarn("ui-history: failed to load events view preference", () => {
      const v = readWithLegacyCopy(
        eventsViewKey(pid),
        pid === "default" ? LS_EVENTS_VIEW : null,
      );
      eventsViewMode.value = v === "raw" ? "raw" : "preview";
    });
  }

  function saveEventsView(pid: string): void {
    safeWarn("ui-history: failed to save events view preference", () =>
      persistenceAdapter.write(eventsViewKey(pid), eventsViewMode.value),
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
