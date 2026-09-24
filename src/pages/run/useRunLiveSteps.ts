import { computed, type ComputedRef, type Ref } from "vue";
import type { useUiStore } from "@/shared/store/ui";
import type { useInjectedSwarmRunController } from "@/features/swarm-run";

export type StepState = "active" | "completed" | "failed" | "pending";
export type LogFilter = "all" | "errors" | "files";
export type LogClass = "sys" | "agent" | "rev" | "tool" | "error";

export interface StepRow {
  id: string;
  state: StepState;
}

export interface EventRow {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

export interface StepLogGroup {
  /** Step id, or "__system__" for orchestrator/system events. */
  id: string;
  label: string;
  state: StepState | "system";
  durationMs: number | null;
  events: EventRow[];
}

export const SYSTEM_LOG_GROUP_ID = "__system__";

type UiStore = ReturnType<typeof useUiStore>;
type SwarmRunController = ReturnType<typeof useInjectedSwarmRunController>;

/**
 * Read-only view of a historical run, sourced from the loaded HistoryEntry and
 * its task snapshot instead of the live ui store. When provided, the steps and
 * log render from this data and `isRunning` is treated as false (a completed run
 * never has an active step).
 */
export interface HistorySource {
  pipelineSteps: string[];
  events: EventRow[];
  /** Step the run failed at (task snapshot `failed_step`), when known. */
  failedStep?: string | null;
  /** True while the viewed run is still working, so it has a step in progress. */
  runIsActive?: boolean;
}

interface RunLiveStepsOptions {
  ui: UiStore;
  controller: SwarmRunController;
  isRunning: ComputedRef<boolean>;
  logFilter: Ref<LogFilter>;
  /** When set, steps + log come from the historical run, not the live store. */
  history?: ComputedRef<HistorySource | null>;
}

export function useRunLiveSteps({
  ui,
  controller,
  isRunning,
  logFilter,
  history,
}: RunLiveStepsOptions) {
  const historySource = computed<HistorySource | null>(() => history?.value ?? null);

  const events = computed<EventRow[]>(() => {
    const source = historySource.value;
    if (source) return source.events;
    return ui.taskHistory as EventRow[];
  });

  const filteredEvents = computed(() => {
    if (logFilter.value === "all") return events.value;
    if (logFilter.value === "errors") {
      return events.value.filter(
        (event) => event.status === "failed" || event.status === "error",
      );
    }
    return events.value.filter(
      (event) =>
        event.agent === "file" || /artifact|wrote|file:/i.test(event.message ?? ""),
    );
  });

  const plannedStepIds = computed<string[]>(() => {
    const source = historySource.value;
    if (source) return source.pipelineSteps;
    if (ui.runAvailability === "unavailable") return [];
    const fromController = controller.currentPipelineSteps.value;
    if (fromController.length) return fromController;
    const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
    if (fromPlan.length) return fromPlan;
    // A run restored after a reload never went through onStartRun, and its
    // pipeline.json is only written once the run finalises/pauses — so the
    // steps recorded for this task at launch are the only source left.
    const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
    return entry?.pipeline_steps ?? [];
  });

  function deriveStepStatesFromHistory(stepIds: string[]): {
    completed: Set<string>;
    failed: Set<string>;
    runningAgents: Set<string>;
    started: Set<string>;
  } {
    const completed = new Set<string>();
    const failed = new Set<string>();
    const runningAgents = new Set<string>();
    const started = new Set<string>();
    const stepIdSet = new Set(stepIds);
    for (const event of events.value) {
      const agent = (event.agent ?? "").trim();
      if (!agent || !stepIdSet.has(agent)) continue;
      started.add(agent);
      const status = (event.status ?? "").toLowerCase();
      if (status === "completed") {
        completed.add(agent);
        runningAgents.delete(agent);
      } else if (status === "failed" || status === "error") {
        failed.add(agent);
        runningAgents.delete(agent);
      } else if (
        status === "in_progress" ||
        status === "running" ||
        status === "started"
      ) {
        if (!completed.has(agent) && !failed.has(agent)) {
          runningAgents.add(agent);
        }
      }
    }
    return { completed, failed, runningAgents, started };
  }

  // Exactly one step can be running. `ui.activeStep` is the live truth; after a
  // reload it may be absent, so the furthest step that reported progress wins.
  function resolveActiveStepIdFromEvents(
    stepIds: string[],
    runningAgents: Set<string>,
    settled: Set<string>,
  ): string | null {
    const selectable = (id: string): boolean => !settled.has(id);
    for (let index = stepIds.length - 1; index >= 0; index -= 1) {
      const id = stepIds[index];
      if (runningAgents.has(id) && selectable(id)) return id;
    }
    return stepIds.find(selectable) ?? null;
  }

  function resolveActiveStepId(
    stepIds: string[],
    runningAgents: Set<string>,
    settled: Set<string>,
  ): string | null {
    const live = (ui.activeStep ?? "").trim();
    if (live && stepIds.includes(live) && !settled.has(live)) return live;
    return resolveActiveStepIdFromEvents(stepIds, runningAgents, settled);
  }

  const stepRows = computed<StepRow[]>(() => {
    const isHistory = historySource.value !== null;
    const stepIds = plannedStepIds.value;
    const derived = deriveStepStatesFromHistory(stepIds);
    // For a historical run the live ui store is unrelated to this entry, so we
    // only trust the snapshot events; the live orchestrator/active-step refs
    // belong to whatever the Run page is currently showing.
    const orchestratorCompleted = isHistory
      ? new Set<string>()
      : new Set(ui.orchestratorCompletedSteps);
    const completedSet = new Set([...orchestratorCompleted, ...derived.completed]);
    const failedSet = new Set(derived.failed);
    // The final pipeline error event is attributed to the orchestrator, not to
    // the step that died — the snapshot's failed_step closes that gap so a
    // failed run does not render its last step as merely "pending".
    const snapshotFailedStep = isHistory
      ? (historySource.value?.failedStep ?? "").trim()
      : "";
    if (snapshotFailedStep && !completedSet.has(snapshotFailedStep)) {
      failedSet.add(snapshotFailedStep);
    }
    const settled = new Set([...completedSet, ...failedSet]);
    // A historical entry cannot use the live `ui.activeStep` — that belongs to
    // whatever the Run page is showing — but its own events still say which
    // step started and never reported completion.
    const activeId = isHistory
      ? (historySource.value?.runIsActive
          ? resolveActiveStepIdFromEvents(stepIds, derived.runningAgents, settled)
          : null)
      : (isRunning.value
          ? resolveActiveStepId(stepIds, derived.runningAgents, settled)
          : null);
    const activeIndex = activeId ? stepIds.indexOf(activeId) : -1;
    return stepIds.map((id, index) => {
      if (failedSet.has(id)) return { id, state: "failed" as const };
      if (completedSet.has(id)) return { id, state: "completed" as const };
      if (id === activeId) return { id, state: "active" as const };
      // The pipeline is sequential: a step that reported progress and sits
      // before the running one has finished, even though its "completed" event
      // never reached this client (orchestrator events are live-only, so a run
      // restored after a reload has none). Steps with no events at all stay
      // pending — a skipped step must not be reported as done.
      if (activeIndex >= 0 && index < activeIndex && derived.started.has(id)) {
        return { id, state: "completed" as const };
      }
      return { id, state: "pending" as const };
    });
  });

  const stepGroups = computed<StepLogGroup[]>(() => {
    const stepIds = plannedStepIds.value;
    const stepIdSet = new Set(stepIds);
    const stateById = new Map(stepRows.value.map((row) => [row.id, row.state]));
    const byStep = new Map<string, EventRow[]>();
    for (const id of stepIds) byStep.set(id, []);
    const systemEvents: EventRow[] = [];
    for (const event of filteredEvents.value) {
      const agent = (event.agent ?? "").trim();
      if (agent && stepIdSet.has(agent)) byStep.get(agent)?.push(event);
      else systemEvents.push(event);
    }
    const durationOf = (rows: EventRow[]): number | null => {
      const times = rows
        .map((row) => Date.parse(row.timestamp ?? ""))
        .filter((value) => !Number.isNaN(value));
      return times.length >= 2 ? Math.max(...times) - Math.min(...times) : null;
    };
    const groups: StepLogGroup[] = stepIds.map((id) => ({
      id,
      label: id,
      state: stateById.get(id) ?? "pending",
      durationMs: durationOf(byStep.get(id) ?? []),
      events: byStep.get(id) ?? [],
    }));
    if (systemEvents.length) {
      groups.push({
        id: SYSTEM_LOG_GROUP_ID,
        label: "orchestrator",
        state: "system",
        durationMs: durationOf(systemEvents),
        events: systemEvents,
      });
    }
    return groups;
  });

  const totalSteps = computed(() => stepRows.value.length);
  const currentStepIndex = computed(() => {
    const idx = stepRows.value.findIndex((step) => step.state === "active");
    return idx >= 0 ? idx + 1 : totalSteps.value;
  });

  function classifyEvent(event: EventRow): LogClass {
    if (event.status === "failed" || event.status === "error") return "error";
    if (event.agent === "tool") return "tool";
    if (event.agent === "reviewer" || event.agent?.includes("review")) return "rev";
    if (event.agent === "system" || event.agent === "orchestrator") return "sys";
    return "agent";
  }

  function formatTime(timestamp: string | undefined): string {
    if (!timestamp) return "";
    const value = Date.parse(timestamp);
    if (Number.isNaN(value)) return timestamp;
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return {
    events,
    filteredEvents,
    plannedStepIds,
    stepRows,
    stepGroups,
    totalSteps,
    currentStepIndex,
    classifyEvent,
    formatTime,
  };
}
