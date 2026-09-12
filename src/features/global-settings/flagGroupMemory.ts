import type { FeatureFlagGroup } from "./featureFlagFieldTypes";

export const FLAG_GROUP_MEMORY: FeatureFlagGroup = {
  id: "memory",
  fields: [
    {
      kind: "boolean",
      field: "swarm_wiki_search_enabled",
      envName: "SWARM_WIKI_SEARCH_ENABLED",
    },
    { kind: "boolean", field: "swarm_wiki_writer", envName: "SWARM_WIKI_WRITER" },
    {
      kind: "boolean",
      field: "swarm_pattern_memory",
      envName: "SWARM_PATTERN_MEMORY",
    },
    {
      kind: "boolean",
      field: "swarm_cross_task_memory",
      envName: "SWARM_CROSS_TASK_MEMORY",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_traces_enabled",
      envName: "SWARM_RETRIEVAL_TRACES_ENABLED",
    },
    {
      kind: "string",
      field: "swarm_retrieval_traces_max_per_workspace",
      envName: "SWARM_RETRIEVAL_TRACES_MAX_PER_WORKSPACE",
      placeholder: "200",
    },
    {
      kind: "boolean",
      field: "swarm_unified_memory_search",
      envName: "SWARM_UNIFIED_MEMORY_SEARCH",
    },
    {
      kind: "boolean",
      field: "swarm_code_rag_enabled",
      envName: "SWARM_CODE_RAG_ENABLED",
      wired: true,
    },
    {
      kind: "boolean",
      field: "swarm_code_rag_repomap",
      envName: "SWARM_CODE_RAG_REPOMAP",
      wired: true,
    },
  ],
};
