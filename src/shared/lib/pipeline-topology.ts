export type TopologyId = "linear" | "parallel" | "ring" | "mesh";

export interface TopologyPreset {
  id: TopologyId;
  label: string;
  mergePairs: ReadonlyArray<readonly [string, string]>;
  swarmFlags?: Readonly<Record<string, unknown>>;
  recommendedSteps: ReadonlyArray<string>;
}

const CORE_MINIMAL: ReadonlyArray<string> = [
  "clarify_input",
  "pm",
  "ba",
  "architect",
  "spec_merge",
  "dev_lead",
  "dev",
  "qa",
];

export const TOPOLOGY_PRESETS: Readonly<Record<TopologyId, TopologyPreset>> = {
  linear: {
    id: "linear",
    label: "Linear (sequential)",
    mergePairs: [],
    recommendedSteps: CORE_MINIMAL,
  },
  parallel: {
    id: "parallel",
    label: "Parallel (BA ∥ Architect)",
    mergePairs: [["ba", "architect"]],
    recommendedSteps: CORE_MINIMAL,
  },
  ring: {
    id: "ring",
    label: "Ring (QA feedback loop)",
    mergePairs: [],
    recommendedSteps: CORE_MINIMAL,
  },
  mesh: {
    id: "mesh",
    label: "Mesh (Dev subtasks parallel)",
    mergePairs: [],
    swarmFlags: { topology: "mesh" },
    recommendedSteps: CORE_MINIMAL,
  },
};

export function recommendedStepsForTopology(
  topology: TopologyId | string,
): ReadonlyArray<string> {
  const preset = TOPOLOGY_PRESETS[topology as TopologyId];
  return preset ? preset.recommendedSteps : TOPOLOGY_PRESETS.linear.recommendedSteps;
}

export function deriveStagesFromPreset(
  stepIds: ReadonlyArray<string>,
  preset: TopologyPreset,
): string[][] {
  const stages: string[][] = [];
  const pairs = preset.mergePairs.map((p) => [p[0], p[1]] as [string, string]);
  let i = 0;
  while (i < stepIds.length) {
    const cur = stepIds[i];
    const next = i + 1 < stepIds.length ? stepIds[i + 1] : null;
    const match = next
      ? pairs.find(([a, b]) => (cur === a && next === b) || (cur === b && next === a))
      : undefined;
    if (match && next) {
      stages.push([cur, next]);
      i += 2;
    } else {
      stages.push([cur]);
      i += 1;
    }
  }
  return stages;
}

export function deriveStagesForTopology(
  stepIds: ReadonlyArray<string>,
  topology: TopologyId | string,
): string[][] {
  if (!stepIds.length) return [];
  const preset = TOPOLOGY_PRESETS[topology as TopologyId];
  if (!preset) {
    const valid = Object.keys(TOPOLOGY_PRESETS).join(", ");
    throw new Error(`Unknown topology "${topology}". Valid: ${valid}`);
  }
  return deriveStagesFromPreset(stepIds, preset);
}
