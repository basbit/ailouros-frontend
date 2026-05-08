import { pipelineStepDependencies } from "@/shared/lib/use-swarm-defaults";

export interface StepOrderViolation {
  stepId: string;
  stepIndex: number;
  missingPrerequisite: string;
  prerequisiteIndex: number | null;
}

export interface StepOrderReport {
  violations: StepOrderViolation[];
  hasViolations: boolean;
}

export function analyzePipelineStepOrder(
  stepIds: ReadonlyArray<string>,
  dependencyOverride?: Record<string, string[]>,
): StepOrderReport {
  const rules = dependencyOverride ?? pipelineStepDependencies();
  const violations: StepOrderViolation[] = [];
  for (let stepIndex = 0; stepIndex < stepIds.length; stepIndex += 1) {
    const stepId = stepIds[stepIndex];
    const prerequisites = rules[stepId] ?? [];
    for (const prerequisite of prerequisites) {
      const prerequisiteIndex = stepIds.indexOf(prerequisite);
      if (prerequisiteIndex === -1) continue;
      if (prerequisiteIndex >= stepIndex) {
        violations.push({
          stepId,
          stepIndex,
          missingPrerequisite: prerequisite,
          prerequisiteIndex,
        });
      }
    }
  }
  return { violations, hasViolations: violations.length > 0 };
}

export function violatingStepIds(report: StepOrderReport): Set<string> {
  return new Set(report.violations.map((violation) => violation.stepId));
}

export function formatStepOrderSummary(report: StepOrderReport): string {
  if (!report.hasViolations) return "";
  return report.violations
    .map((violation) => {
      const where =
        violation.prerequisiteIndex === null
          ? "missing from pipeline"
          : `currently at #${violation.prerequisiteIndex + 1}`;
      return `${violation.stepId} (#${violation.stepIndex + 1}) requires ${
        violation.missingPrerequisite
      } before it (${where})`;
    })
    .join("\n");
}
