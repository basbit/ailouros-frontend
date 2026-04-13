import { computed } from "vue";

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
}

export interface GraphStepRef {
  id: string;
  index: number;
}

export type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export function usePipelineGraphLayout(props: LayoutProps) {
  const stepRefs = computed((): GraphStepRef[] =>
    props.steps.map((id, index) => ({ id, index })),
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

  const hierarchicalRows = computed((): GraphStepRef[][] => {
    const [first, ...rest] = stepRefs.value;
    if (!first) return [];
    const rows: GraphStepRef[][] = [[first]];
    for (let i = 0; i < rest.length; i += 3) {
      rows.push(rest.slice(i, i + 3));
    }
    return rows;
  });

  function stepStatus(stepId: string): StepStatus {
    if (props.failedStep === stepId) return "failed";
    if (props.activeStep === stepId) return "in_progress";
    if (props.completedSteps?.includes(stepId)) return "completed";
    if (props.skippedSteps?.includes(stepId)) return "skipped";
    return "pending";
  }

  return { stepRefs, parallelStages, hierarchicalRows, stepStatus };
}
