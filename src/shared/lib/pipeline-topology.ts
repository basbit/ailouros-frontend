export type TopologyId = "ring" | "mesh";

export interface TopologyPreset {
  id: TopologyId;
  label: string;
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
  ring: {
    id: "ring",
    label: "Ring (QA feedback loop)",
    recommendedSteps: CORE_MINIMAL,
  },
  mesh: {
    id: "mesh",
    label: "Mesh (QA subtasks parallel)",
    recommendedSteps: CORE_MINIMAL,
  },
};

export function recommendedStepsForTopology(
  topology: TopologyId | string,
): ReadonlyArray<string> {
  const preset = TOPOLOGY_PRESETS[topology as TopologyId];
  return preset ? preset.recommendedSteps : TOPOLOGY_PRESETS.ring.recommendedSteps;
}
