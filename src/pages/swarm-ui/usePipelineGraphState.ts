import { computed } from "vue";
import type { AppSettings } from "@/entities/app-settings/contract";
import { useScenarioCatalog } from "@/features/scenario-picker";
import type { useUiStore } from "@/shared/store/ui";
import { CUSTOM_SCENARIO_ID } from "@/shared/lib/swarm-ui-constants";

type SettingsRef = AppSettings;
type UiRef = ReturnType<typeof useUiStore>;

const PIPELINE_STEP_ID_ALIASES: Record<string, string> = {
  arch: "architect",
  stack_review: "review_stack",
  pm_tasks: "dev_lead",
  review_pm_tasks: "review_dev_lead",
  human_pm_tasks: "human_dev_lead",
};

function normalizePipelineStepId(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return PIPELINE_STEP_ID_ALIASES[raw] ?? raw;
}

function isNonTerminalHistoryMessage(stepId: string, message: unknown): boolean {
  const text = String(message ?? "")
    .trim()
    .toLowerCase();
  if (!text) return true;
  return text === `${stepId} started` || text === "continuing after shell-gate";
}

function sameStepSequence(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every(
      (stepId, index) =>
        normalizePipelineStepId(stepId) === normalizePipelineStepId(right[index]),
    )
  );
}

function normalizedStepIndex(
  steps: string[],
  stepId: string | null | undefined,
): number {
  const target = normalizePipelineStepId(stepId);
  if (!target) return -1;
  return steps.findIndex((candidate) => normalizePipelineStepId(candidate) === target);
}

export function usePipelineGraphState(settings: SettingsRef, ui: UiRef) {
  const catalog = useScenarioCatalog();

  const configuredPipelineSteps = computed(() =>
    settings.pipelineState.collectStepIds(),
  );

  const runPipelineSteps = computed(() => {
    const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
    if (fromPlan.length) return fromPlan;
    const taskId = (ui.taskId ?? "").trim();
    if (!taskId) return [];
    const historyEntry = ui.historyList.find(
      (entry) => (entry.taskId ?? "").trim() === taskId,
    );
    return historyEntry?.pipeline_steps ?? [];
  });

  const isCustomScenario = computed(() => {
    const id = (settings.form.scenario_id ?? "").trim();
    return !id || id === CUSTOM_SCENARIO_ID;
  });

  const activeScenario = computed(() => {
    const id = (settings.form.scenario_id ?? "").trim();
    if (!id || id === CUSTOM_SCENARIO_ID) return null;
    return catalog.scenarios.value.find((entry) => entry.id === id) ?? null;
  });

  const scenarioPreviewSteps = computed(() => {
    const scenario = activeScenario.value;
    return scenario ? scenario.pipeline_steps : [];
  });

  const isViewingTaskRun = computed(() => {
    const taskId = (ui.taskId ?? "").trim();
    return !!taskId && runPipelineSteps.value.length > 0;
  });

  const effectivePipelineSteps = computed(() => {
    if (isViewingTaskRun.value) {
      return runPipelineSteps.value;
    }
    if (!isCustomScenario.value && scenarioPreviewSteps.value.length) {
      return scenarioPreviewSteps.value;
    }
    if (configuredPipelineSteps.value.length) {
      return configuredPipelineSteps.value;
    }
    return runPipelineSteps.value;
  });

  const graphShowsLastRunState = computed(() => {
    if (!runPipelineSteps.value.length) return false;
    return sameStepSequence(runPipelineSteps.value, effectivePipelineSteps.value);
  });

  const failedStepForGraph = computed(() => {
    if (!graphShowsLastRunState.value) return undefined;
    const planFailed = normalizePipelineStepId(ui.taskPipelinePlan?.failed_step);
    if (planFailed) return planFailed;
    const retryFailed = normalizePipelineStepId(ui.retryFailedStep);
    return retryFailed && retryFailed !== "(unknown)" ? retryFailed : undefined;
  });

  const activeStepForGraph = computed(() => normalizePipelineStepId(ui.activeStep));

  const retryingStepsForGraph = computed((): string[] =>
    Array.from(ui.retryingSteps).map((stepId) => normalizePipelineStepId(stepId)),
  );

  const blockedStepForGraph = computed(() =>
    ui.blockedStep ? normalizePipelineStepId(ui.blockedStep) : null,
  );

  function addPredecessorsAsCompleted(
    completed: Set<string>,
    steps: string[],
    anchorStepId: string | null,
  ): void {
    if (!anchorStepId) return;
    const anchorIndex = normalizedStepIndex(steps, anchorStepId);
    if (anchorIndex <= 0) return;
    for (const stepId of steps.slice(0, anchorIndex)) {
      completed.add(normalizePipelineStepId(stepId));
    }
  }

  function addHistoryDerivedCompleted(
    completed: Set<string>,
    visibleStepIds: Set<string>,
    activeStepId: string | null,
    failedStepId: string | null,
  ): void {
    for (const event of ui.taskHistory) {
      const stepId = normalizePipelineStepId(event.agent);
      if (!stepId || !visibleStepIds.has(stepId)) continue;
      if (stepId === activeStepId || stepId === failedStepId) continue;
      if (isNonTerminalHistoryMessage(stepId, event.message)) continue;
      completed.add(stepId);
    }
  }

  function addSnapshotDerivedCompleted(
    completed: Set<string>,
    visibleStepIds: Set<string>,
  ): void {
    const plan = ui.taskPipelinePlan;
    const partialState =
      (plan?.partial_state as Record<string, unknown> | undefined) ?? null;
    const snapshots = [plan as Record<string, unknown> | null, partialState];
    for (const snapshot of snapshots) {
      if (!snapshot) continue;
      for (const stepId of visibleStepIds) {
        const value = snapshot[`${stepId}_output`];
        if (typeof value === "string" && value.trim()) {
          completed.add(stepId);
        }
      }
    }
  }

  const completedStepsFromHistory = computed((): string[] => {
    const steps = effectivePipelineSteps.value;
    if (!steps.length) return [];
    if (ui.taskStatus === "completed" && graphShowsLastRunState.value) {
      return [...steps];
    }
    const activeStepId = activeStepForGraph.value || null;
    const failedStepId = failedStepForGraph.value ?? null;
    const visibleStepIds = new Set(
      steps.map((stepId) => normalizePipelineStepId(stepId)),
    );
    const completed = new Set<string>();
    addPredecessorsAsCompleted(completed, steps, failedStepId);
    addPredecessorsAsCompleted(completed, steps, activeStepId);
    addHistoryDerivedCompleted(completed, visibleStepIds, activeStepId, failedStepId);
    addSnapshotDerivedCompleted(completed, visibleStepIds);
    return steps.filter((stepId) => completed.has(normalizePipelineStepId(stepId)));
  });

  const clarifyCacheProvenance = computed(() => {
    const plan = ui.taskPipelinePlan;
    const partial = (plan?.partial_state ?? {}) as Record<string, unknown>;
    const cache =
      (partial.clarify_input_cache as Record<string, unknown> | undefined) ??
      ((plan as Record<string, unknown> | null)?.clarify_input_cache as
        | Record<string, unknown>
        | undefined);
    if (!cache) return "";
    const hit = cache.hit === true ? "hit" : "miss";
    const reason =
      typeof cache.reuse_blocked_reason === "string" && cache.reuse_blocked_reason
        ? `, ${cache.reuse_blocked_reason}`
        : "";
    const key =
      typeof cache.cache_key === "string" && cache.cache_key
        ? `, key=${cache.cache_key}`
        : "";
    return `${hit}${reason}${key}`;
  });

  const workspaceIdentityResolved = computed(() => {
    const plan = ui.taskPipelinePlan;
    const partial = (plan?.partial_state ?? {}) as Record<string, unknown>;
    const identity = partial.workspace_identity as Record<string, unknown> | undefined;
    if (identity && typeof identity.workspace_root_resolved === "string") {
      return identity.workspace_root_resolved;
    }
    const workspace = (plan as Record<string, unknown> | null)?.workspace as
      | Record<string, unknown>
      | undefined;
    if (workspace && typeof workspace.workspace_root_resolved === "string") {
      return workspace.workspace_root_resolved;
    }
    return "";
  });

  return {
    configuredPipelineSteps,
    effectivePipelineSteps,
    failedStepForGraph,
    activeStepForGraph,
    retryingStepsForGraph,
    blockedStepForGraph,
    completedStepsFromHistory,
    clarifyCacheProvenance,
    workspaceIdentityResolved,
    isCustomScenario,
    activeScenario,
  };
}
