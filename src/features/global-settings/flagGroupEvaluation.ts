import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_EVALUATION: FeatureFlagGroup = {
  id: "evaluation",
  fields: [
    {
      kind: "boolean",
      field: "swarm_evaluation_ragas",
      envName: "SWARM_EVALUATION_RAGAS_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_evaluation_entailment",
      envName: "SWARM_EVALUATION_ENTAILMENT_ENABLED",
      wired: true,
    },
    { kind: "boolean", field: "swarm_otel_enabled", envName: "SWARM_OTEL_ENABLED" },
    {
      kind: "enum",
      field: "swarm_sandbox_default_profile",
      envName: "SWARM_SANDBOX_DEFAULT_PROFILE",
      wired: true,
      options: [
        { value: "", i18nSuffix: "empty" },
        { value: "subprocess", i18nSuffix: "subprocess" },
        { value: "docker", i18nSuffix: "docker" },
      ],
    },
  ],
};
