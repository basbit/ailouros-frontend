import {
  getCachedRolesCatalog,
  onRolesCatalogUpdate,
} from "@/shared/api/endpoints/rolesCatalog";

interface PipelineStepPlanEntry {
  id: string;
  role_ref?: string;
  label?: string;
}

function _pipelineStepPlan(): readonly PipelineStepPlanEntry[] {
  const catalog = getCachedRolesCatalog() as {
    pipeline_step_plan?: PipelineStepPlanEntry[];
  };
  if (Array.isArray(catalog.pipeline_step_plan)) {
    return catalog.pipeline_step_plan;
  }
  return [];
}

function _roleLabel(roleId: string): string {
  const catalog = getCachedRolesCatalog();
  const entry = catalog.roles.find((r) => r.id === roleId);
  return entry?.label ?? roleId;
}

function buildPipelineOptionsBase(): [string, string][] {
  return _pipelineStepPlan().map((step) => {
    if (step.role_ref) {
      return [step.id, _roleLabel(step.role_ref)] as [string, string];
    }
    return [step.id, step.label ?? step.id] as [string, string];
  });
}

export function pipelineStepLabels(): Record<string, string> {
  return Object.fromEntries(buildPipelineOptionsBase());
}

export function roleRefForStep(stepId: string): string | null {
  const entry = _pipelineStepPlan().find((step) => step.id === stepId);
  return entry?.role_ref ?? null;
}

export const PIPELINE_OPTIONS_BASE: [string, string][] = buildPipelineOptionsBase();

onRolesCatalogUpdate(() => {
  const freshOptions = buildPipelineOptionsBase();
  PIPELINE_OPTIONS_BASE.length = 0;
  for (const pair of freshOptions) {
    PIPELINE_OPTIONS_BASE.push(pair);
  }
});
