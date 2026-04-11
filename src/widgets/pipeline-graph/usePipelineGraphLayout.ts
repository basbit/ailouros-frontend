import { computed } from "vue";

const PARALLEL_GROUP_MAP: Record<string, string> = {
  ba: "ba-arch",
  arch: "ba-arch",
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

export type StepStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";

export function usePipelineGraphLayout(props: LayoutProps) {
  const parallelStages = computed((): string[][] => {
    const result: string[][] = [];
    const used = new Set<string>();
    for (const step of props.steps) {
      if (used.has(step)) continue;
      const groupId = PARALLEL_GROUP_MAP[step];
      if (groupId) {
        const siblings = props.steps.filter(
          (x) => PARALLEL_GROUP_MAP[x] === groupId && !used.has(x),
        );
        if (siblings.length > 1) {
          siblings.forEach((x) => used.add(x));
          result.push(siblings);
          continue;
        }
      }
      used.add(step);
      result.push([step]);
    }
    return result;
  });

  const hierarchicalRows = computed((): string[][] => {
    if (!props.steps.length) return [];
    const rows: string[][] = [[props.steps[0]]];
    const rest = props.steps.slice(1);
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

  return { parallelStages, hierarchicalRows, stepStatus };
}
