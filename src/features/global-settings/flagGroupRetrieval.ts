import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_RETRIEVAL: FeatureFlagGroup = {
  id: "retrieval",
  fields: [
    {
      kind: "string",
      field: "swarm_retrieval_rerank_model_id",
      envName: "SWARM_RETRIEVAL_RERANK_MODEL_ID",
      placeholder: "cross-encoder/ms-marco-MiniLM-L-6-v2",
    },
    {
      kind: "string",
      field: "swarm_retrieval_query_rewrite_model",
      envName: "SWARM_RETRIEVAL_QUERY_REWRITE_MODEL",
      placeholder: "model id (optional)",
    },
    {
      kind: "string",
      field: "swarm_retrieval_multi_query_count",
      envName: "SWARM_RETRIEVAL_MULTI_QUERY_COUNT",
      placeholder: "1",
    },
    {
      kind: "string",
      field: "swarm_retrieval_recency_half_life_days",
      envName: "SWARM_RETRIEVAL_RECENCY_HALF_LIFE_DAYS",
      placeholder: "30",
    },
    {
      kind: "string",
      field: "swarm_retrieval_mmr_lambda",
      envName: "SWARM_RETRIEVAL_MMR_LAMBDA",
      placeholder: "0.7",
    },
    {
      kind: "string",
      field: "swarm_retrieval_crag_model",
      envName: "SWARM_RETRIEVAL_CRAG_MODEL",
      placeholder: "model id (optional)",
    },
    {
      kind: "string",
      field: "swarm_retrieval_hyde_model",
      envName: "SWARM_RETRIEVAL_HYDE_MODEL",
      placeholder: "model id (optional)",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_query_rewrite",
      envName: "SWARM_RETRIEVAL_QUERY_REWRITE_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_contextual_prefix",
      envName: "SWARM_RETRIEVAL_CONTEXTUAL_PREFIX_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_late_chunking",
      envName: "SWARM_RETRIEVAL_LATE_CHUNKING_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_hierarchical",
      envName: "SWARM_RETRIEVAL_HIERARCHICAL_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_knowledge_graph",
      envName: "SWARM_RETRIEVAL_KNOWLEDGE_GRAPH_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_crag",
      envName: "SWARM_RETRIEVAL_CRAG_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_self_rag",
      envName: "SWARM_RETRIEVAL_SELF_RAG_ENABLED",
    },
    {
      kind: "enum",
      field: "swarm_retrieval_self_rag_classifier",
      envName: "SWARM_RETRIEVAL_SELF_RAG_CLASSIFIER",
      wired: true,
      options: [
        { value: "", i18nSuffix: "auto" },
        { value: "heuristic", i18nSuffix: "heuristic" },
        { value: "feature", i18nSuffix: "feature" },
        { value: "llm", i18nSuffix: "llm" },
        { value: "ensemble", i18nSuffix: "ensemble" },
      ],
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_hyde",
      envName: "SWARM_RETRIEVAL_HYDE_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_retrieval_incremental_indexing",
      envName: "SWARM_RETRIEVAL_INCREMENTAL_INDEXING",
    },
    {
      kind: "enum",
      field: "swarm_retrieval_strategy_selector",
      envName: "SWARM_RETRIEVAL_STRATEGY_SELECTOR",
      wired: true,
      options: [
        { value: "", i18nSuffix: "static-default" },
        { value: "complexity-aware", i18nSuffix: "complexity-aware" },
        { value: "adaptive", i18nSuffix: "adaptive" },
      ],
    },
    {
      kind: "string",
      field: "swarm_retrieval_self_refine_max_iters",
      envName: "SWARM_RETRIEVAL_SELF_REFINE_MAX_ITERS",
      placeholder: "0",
    },
    {
      kind: "enum",
      field: "swarm_retrieval_vector_index_backend",
      envName: "SWARM_RETRIEVAL_VECTOR_INDEX_BACKEND",
      wired: true,
      options: [
        { value: "", i18nSuffix: "linear" },
        { value: "hnsw", i18nSuffix: "hnsw" },
      ],
    },
    {
      kind: "enum",
      field: "swarm_retrieval_embedding_profile_id",
      envName: "SWARM_RETRIEVAL_EMBEDDING_PROFILE_ID",
      wired: true,
      options: [
        { value: "", i18nSuffix: "general" },
        { value: "code", i18nSuffix: "code" },
        { value: "multilingual", i18nSuffix: "multilingual" },
      ],
    },
    {
      kind: "enum",
      field: "swarm_retrieval_chunking_policy_id",
      envName: "SWARM_RETRIEVAL_CHUNKING_POLICY_ID",
      wired: true,
      options: [{ value: "", i18nSuffix: "context-aware-default" }],
    },
    {
      kind: "string",
      field: "swarm_retrieval_duplicate_collapse_threshold",
      envName: "SWARM_RETRIEVAL_DUPLICATE_COLLAPSE_THRESHOLD",
      placeholder: "0",
    },
  ],
};
