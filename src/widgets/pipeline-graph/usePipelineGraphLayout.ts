import { computed, type Ref } from "vue";

const PARALLEL_GROUP_MAP: Record<string, string> = {
  ba: "ba-arch",
  arch: "ba-arch",
  architect: "ba-arch",
  analyze_code: "analyze-docs",
  generate_documentation: "analyze-docs",
  problem_spotter: "spot-refactor",
  refactor_plan: "spot-refactor",
  devops: "devops-lead",
  dev_lead: "devops-lead",
};

interface LayoutProps {
  steps: string[];
  activeStep?: string | null;
  completedSteps?: string[];
  failedStep?: string;
  skippedSteps?: string[];
  retryingSteps?: string[];
  blockedStep?: string | null;
}

export interface GraphStepRef {
  id: string;
  index: number;
}

export type StepStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped"
  | "retrying"
  | "blocked";

/**
 * @param props       - reactive display props (steps = effectivePipelineSteps)
 * @param stepsOverride - when provided, used instead of props.steps for rendering
 *                        and index calculations (e.g. editorSteps ids so that
 *                        drag indices always match the configured array, not the
 *                        historical run steps shown for status decoration).
 */
export function usePipelineGraphLayout(
  props: LayoutProps,
  stepsOverride?: Ref<string[]>,
) {
  // Use override when it contains steps; otherwise fall back to display steps.
  const effectiveSteps = computed<string[]>(() =>
    stepsOverride?.value?.length ? stepsOverride.value : props.steps,
  );

  const stepRefs = computed((): GraphStepRef[] =>
    effectiveSteps.value.map((id, index) => ({ id, index })),
  );

  const parallelStages = computed((): GraphStepRef[][] => {
    const result: GraphStepRef[][] = [];
    const used = new Set<number>();
    for (const step of stepRefs.value) {
      if (used.has(step.index)) continue;
      const groupId = PARALLEL_GROUP_MAP[step.id];
      if (groupId) {
        const siblings = stepRefs.value.filter(
          (candidate) =>
            PARALLEL_GROUP_MAP[candidate.id] === groupId && !used.has(candidate.index),
        );
        if (siblings.length > 1) {
          siblings.forEach((candidate) => used.add(candidate.index));
          result.push(siblings);
          continue;
        }
      }
      used.add(step.index);
      result.push([step]);
    }
    return result;
  });

  function stepStatus(stepId: string): StepStatus {
    if (props.blockedStep === stepId) return "blocked";
    if (props.failedStep === stepId) return "failed";
    if (props.retryingSteps?.includes(stepId)) return "retrying";
    if (props.activeStep === stepId) return "in_progress";
    if (props.completedSteps?.includes(stepId)) return "completed";
    if (props.skippedSteps?.includes(stepId)) return "skipped";
    return "pending";
  }

  return { stepRefs, parallelStages, stepStatus };
}
