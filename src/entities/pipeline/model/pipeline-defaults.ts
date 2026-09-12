import { swarmDefaultsSnapshot } from "@/shared/lib/use-swarm-defaults";

export function defaultPipelineOrder(): string[] {
  return [...(swarmDefaultsSnapshot().default_pipeline_order || [])];
}

export function pipelineStepDependencies(): Record<string, string[]> {
  const raw = swarmDefaultsSnapshot().step_dependencies || {};
  const out: Record<string, string[]> = {};
  for (const [stepId, prerequisites] of Object.entries(raw)) {
    out[stepId] = Array.isArray(prerequisites) ? [...prerequisites] : [];
  }
  return out;
}
