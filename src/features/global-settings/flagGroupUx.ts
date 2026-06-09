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
      field: "swarm_ux_feedback_collection",
      envName: "SWARM_UX_FEEDBACK_COLLECTION_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_ux_inline_citations",
      envName: "SWARM_UX_INLINE_CITATIONS_ENABLED",
      wired: true,
    },
    {
      kind: "string",
      field: "swarm_ux_follow_up_suggestions_count",
      envName: "SWARM_UX_FOLLOW_UP_SUGGESTIONS_COUNT",
      placeholder: "0",
      wired: true,
    },
  ],
};
