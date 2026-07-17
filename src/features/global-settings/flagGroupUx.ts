import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_UX: FeatureFlagGroup = {
  id: "ux",
  fields: [
    {
      kind: "boolean",
      field: "swarm_ux_streaming_partial_rag",
      envName: "SWARM_UX_STREAMING_PARTIAL_RAG_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_ux_inline_citations",
      envName: "SWARM_UX_INLINE_CITATIONS_ENABLED",
      wired: true,
    },
  ],
};
