import { computed, ref } from "vue";
import { useUiStore } from "@/shared/store/ui";

export interface MultiRunItem {
  taskId: string;
  scenarioTitle: string | null;
  status: string;
  /** The run's real pipeline step ids, in execution order. */
  steps: string[];
  /** Only known for the run the store is currently tracking. */
  activeStep: string | null;
  completedSteps: string[];
}

const ATTENTION_STATUSES = new Set([
  "awaiting_human",
  "awaiting_shell_confirm",
  "blocked",
]);

export function isAttentionStatus(status: string | null | undefined): boolean {
  return ATTENTION_STATUSES.has((status ?? "").toLowerCase());
}

/**
 * The run cards on the grid and the canvas render the same data. Building it
 * once keeps the two views from drifting apart, and keeps every card driven by
 * the run's own step list instead of a guessed stage sequence.
 */
export function useMultiRunItems() {
  const ui = useUiStore();

  // A resolved gate has to survive the next store tick. Mutating the item is
  // useless: the list is a computed, rebuilt from the store on every change.
  const resolvedGateStatuses = ref<Map<string, string>>(new Map());

  function stepsForHistoryEntry(taskId: string): string[] {
    const entry = ui.historyList.find((item) => item.taskId === taskId);
    return entry?.pipeline_steps ?? [];
  }

  function stepsForCurrentRun(taskId: string): string[] {
    const planned = ui.taskPipelinePlan?.pipeline_steps;
    if (planned && planned.length > 0) return planned;
    return stepsForHistoryEntry(taskId);
  }

  function mergeHistoryRuns(map: Map<string, MultiRunItem>): void {
    for (const entry of ui.historyList) {
      const entryTaskId = entry.taskId;
      if (!entryTaskId) continue;
      const title = (entry as Record<string, unknown>).scenarioTitle
        ? String((entry as Record<string, unknown>).scenarioTitle)
        : entry.prompt || null;
      const existing = map.get(entryTaskId);
      if (existing) {
        if (title) existing.scenarioTitle = title;
        if (entry.status) existing.status = String(entry.status);
        if (existing.steps.length === 0) existing.steps = entry.pipeline_steps ?? [];
      } else {
        map.set(entryTaskId, {
          taskId: entryTaskId,
          scenarioTitle: title,
          status: entry.status ? String(entry.status) : "completed",
          steps: entry.pipeline_steps ?? [],
          activeStep: null,
          completedSteps: [],
        });
      }
    }
  }

  const allRuns = computed<MultiRunItem[]>(() => {
    const map = new Map<string, MultiRunItem>();

    if (ui.taskId) {
      map.set(ui.taskId, {
        taskId: ui.taskId,
        scenarioTitle: ui.taskScenarioTitle,
        status: String(ui.taskStatus ?? "running"),
        steps: stepsForCurrentRun(ui.taskId),
        activeStep: ui.activeStep,
        completedSteps: Array.from(ui.orchestratorCompletedSteps),
      });
    }

    for (const identifier of ui.activeRunIds ?? []) {
      if (map.has(identifier)) continue;
      map.set(identifier, {
        taskId: identifier,
        scenarioTitle: null,
        status: "in_progress",
        steps: stepsForHistoryEntry(identifier),
        activeStep: null,
        completedSteps: [],
      });
    }

    mergeHistoryRuns(map);

    return Array.from(map.values()).map((item) => {
      const resolved = resolvedGateStatuses.value.get(item.taskId);
      if (!resolved || !isAttentionStatus(item.status)) return item;
      return { ...item, status: resolved };
    });
  });

  function recordGateResolution(taskId: string, approved: boolean): void {
    const next = new Map(resolvedGateStatuses.value);
    next.set(taskId, approved ? "in_progress" : "blocked");
    for (const [knownTaskId] of next) {
      const source = ui.historyList.find((item) => item.taskId === knownTaskId);
      const isCurrent = ui.taskId === knownTaskId;
      const rawStatus = isCurrent ? ui.taskStatus : (source?.status ?? null);
      if (knownTaskId !== taskId && !isAttentionStatus(rawStatus)) {
        next.delete(knownTaskId);
      }
    }
    resolvedGateStatuses.value = next;

    if (ui.taskId === taskId) {
      ui.humanGateVisible = false;
      ui.taskStatus = approved ? "in_progress" : "blocked";
    }
  }

  return { allRuns, recordGateResolution };
}
