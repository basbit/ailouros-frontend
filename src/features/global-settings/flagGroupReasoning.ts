import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_REASONING: FeatureFlagGroup = {
  id: "reasoning",
  fields: [
    {
      kind: "boolean",
      field: "swarm_reflexion",
      envName: "SWARM_REFLEXION_ENABLED",
    },
    {
      kind: "string",
      field: "swarm_reasoning_self_consistency_samples",
      envName: "SWARM_REASONING_SELF_CONSISTENCY_SAMPLES",
      placeholder: "1",
    },
    {
      kind: "string",
      field: "swarm_reasoning_verifier_model",
      envName: "SWARM_REASONING_VERIFIER_MODEL",
      placeholder: "model id (optional)",
    },
    {
      kind: "string",
      field: "swarm_reasoning_prm_model",
      envName: "SWARM_REASONING_PRM_MODEL",
      placeholder: "model id (optional)",
    },
    {
      kind: "boolean",
      field: "swarm_reasoning_prm",
      envName: "SWARM_REASONING_PRM_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_reasoning_verifier",
      envName: "SWARM_REASONING_VERIFIER_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_research_adversarial",
      envName: "SWARM_RESEARCH_ADVERSARIAL",
      wired: true,
    },
  ],
};
