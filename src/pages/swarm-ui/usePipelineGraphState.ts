import { computed } from "vue";
import type { useSettings } from "@/features/project-settings/useSettings";
import type { useUiStore } from "@/shared/store/ui";

type SettingsRef = ReturnType<typeof useSettings>;
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
  const configuredPipelineSteps = computed(() =>
    settings.pipelineState.collectStepIds(),
  );

  const runPipelineSteps = computed(() => {
    const fromPlan = ui.taskPipelinePlan?.pipeline_steps ?? [];
    if (fromPlan.length) return fromPlan;
    const tid = (ui.taskId ?? "").trim();
    if (!tid) return [];
    const historyEntry = ui.historyList.find(
      (entry) => (entry.taskId ?? "").trim() === tid,
    );
    return historyEntry?.pipeline_steps ?? [];
  });

  const effectivePipelineSteps = computed(() => {
    if (runPipelineSteps.value.length) return runPipelineSteps.value;
    return configuredPipelineSteps.value;
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

  const completedStepsFromHistory = computed((): string[] => {
    const steps = effectivePipelineSteps.value;
    const active = activeStepForGraph.value || null;
    const failed = failedStepForGraph.value ?? null;
    if (!steps.length) return [];
    if (ui.taskStatus === "completed" && graphShowsLastRunState.value)
      return [...steps];

    const completed = new Set<string>();
    const visibleStepIds = new Set(
      steps.map((stepId) => normalizePipelineStepId(stepId)),
    );

    if (failed) {
      const idx = normalizedStepIndex(steps, failed);
      if (idx > 0) {
        steps
          .slice(0, idx)
          .forEach((stepId) => completed.add(normalizePipelineStepId(stepId)));
      }
    }
    if (active) {
      const idx = normalizedStepIndex(steps, active);
      if (idx > 0) {
        steps
          .slice(0, idx)
          .forEach((stepId) => completed.add(normalizePipelineStepId(stepId)));
      }
    }

    for (const event of ui.taskHistory) {
      const stepId = normalizePipelineStepId(event.agent);
      if (!stepId || !visibleStepIds.has(stepId)) continue;
      if (stepId === active || stepId === failed) continue;
      if (isNonTerminalHistoryMessage(stepId, event.message)) continue;
      completed.add(stepId);
    }

    const snapshotLike = [
      ui.taskPipelinePlan as Record<string, unknown> | null,
      (ui.taskPipelinePlan?.partial_state as Record<string, unknown> | undefined) ??
        null,
    ];
    for (const snapshot of snapshotLike) {
      if (!snapshot) continue;
      for (const stepId of visibleStepIds) {
        const outputKey = `${stepId}_output`;
        const value = snapshot[outputKey];
        if (typeof value === "string" && value.trim()) {
          completed.add(stepId);
        }
      }
    }

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
  };
}
