import { computed, type ComputedRef, type Ref } from "vue";
import type { useUiStore } from "@/shared/store/ui";
import type { useInjectedSwarmRunController } from "@/features/swarm-run/swarmRunContext";

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

type UiStore = ReturnType<typeof useUiStore>;
type SwarmRunController = ReturnType<typeof useInjectedSwarmRunController>;

interface RunLiveStepsOptions {
  ui: UiStore;
  controller: SwarmRunController;
  isRunning: ComputedRef<boolean>;
  logFilter: Ref<LogFilter>;
}

export function useRunLiveSteps({
  ui,
  controller,
  isRunning,
  logFilter,
}: RunLiveStepsOptions) {
  const events = computed<EventRow[]>(() => ui.taskHistory as EventRow[]);

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
    const fromController = controller.currentPipelineSteps.value;
    if (fromController.length) return fromController;
    const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
    if (fromPlan.length) return fromPlan;
    const taskId = (ui.taskId ?? "").trim();
    if (!taskId) return [];
    const entry = ui.historyList.find((item) => (item.taskId ?? "").trim() === taskId);
    return entry?.pipeline_steps ?? [];
  });

  function deriveStepStatesFromHistory(stepIds: string[]): {
    completed: Set<string>;
    failed: Set<string>;
    runningAgents: Set<string>;
  } {
    const completed = new Set<string>();
    const failed = new Set<string>();
    const runningAgents = new Set<string>();
    const stepIdSet = new Set(stepIds);
    for (const event of events.value) {
      const agent = (event.agent ?? "").trim();
      if (!agent || !stepIdSet.has(agent)) continue;
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
    return { completed, failed, runningAgents };
  }

  const stepRows = computed<StepRow[]>(() => {
    const stepIds = plannedStepIds.value;
    const derived = deriveStepStatesFromHistory(stepIds);
    const orchestratorCompleted = new Set(ui.orchestratorCompletedSteps);
    const completedSet = new Set([...orchestratorCompleted, ...derived.completed]);
    const failedSet = new Set(derived.failed);
    const activeId = ui.activeStep;
    let activeAssigned = false;
    return stepIds.map((id) => {
      if (failedSet.has(id)) return { id, state: "failed" as const };
      if (completedSet.has(id)) return { id, state: "completed" as const };
      if (id === activeId && isRunning.value) {
        activeAssigned = true;
        return { id, state: "active" as const };
      }
      if (derived.runningAgents.has(id) && isRunning.value) {
        activeAssigned = true;
        return { id, state: "active" as const };
      }
      if (!activeAssigned && !activeId && isRunning.value) {
        activeAssigned = true;
        return { id, state: "active" as const };
      }
      return { id, state: "pending" as const };
    });
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
    totalSteps,
    currentStepIndex,
    classifyEvent,
    formatTime,
  };
}
