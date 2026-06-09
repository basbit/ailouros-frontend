import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_EFFICIENCY: FeatureFlagGroup = {
  id: "efficiency",
  fields: [
    { kind: "boolean", field: "swarm_prompt_cache", envName: "SWARM_PROMPT_CACHE" },
    {
      kind: "boolean",
      field: "swarm_delta_prompting",
      envName: "SWARM_DELTA_PROMPTING",
    },
    {
      kind: "boolean",
      field: "swarm_output_compression",
      envName: "SWARM_OUTPUT_COMPRESSION",
    },
    {
      kind: "boolean",
      field: "swarm_efficiency_semantic_cache",
      envName: "SWARM_EFFICIENCY_SEMANTIC_CACHE_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_efficiency_batch_inference",
      envName: "SWARM_EFFICIENCY_BATCH_INFERENCE_ENABLED",
      wired: true,
    },
  ],
};
