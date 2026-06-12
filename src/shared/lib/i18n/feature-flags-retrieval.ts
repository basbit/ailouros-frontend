import type { Messages } from "./types";

export const featureFlagsRetrievalEn: Messages = {
  "featureFlags.field.swarm_retrieval_rerank_model_id.label": "Reranker model id",
  "featureFlags.field.swarm_retrieval_rerank_model_id.hint":
    "HuggingFace cross-encoder id (empty disables reranking).",
  "featureFlags.field.swarm_retrieval_query_rewrite_model.label": "Query-rewrite model",
  "featureFlags.field.swarm_retrieval_query_rewrite_model.hint":
    "Model id used to rewrite/expand the query before retrieval. Empty = passthrough.",
  "featureFlags.field.swarm_retrieval_multi_query_count.label": "Multi-query count",
  "featureFlags.field.swarm_retrieval_multi_query_count.hint":
    "Number of query variants to fan out and merge (1 = off, max 5).",
  "featureFlags.field.swarm_retrieval_recency_half_life_days.label":
    "Recency half-life (days)",
  "featureFlags.field.swarm_retrieval_recency_half_life_days.hint":
    "Half-life in days for the time-decay recency boost (0 = off; default 30).",
  "featureFlags.field.swarm_retrieval_hyde_model.label": "HyDE model",
  "featureFlags.field.swarm_retrieval_hyde_model.hint":
    "Model used to generate the hypothetical answer for HyDE retrieval.",
  "featureFlags.field.swarm_retrieval_query_rewrite.label": "Query rewrite",
  "featureFlags.field.swarm_retrieval_query_rewrite.hint":
    "LLM-rewrite each query before retrieval.",
  "featureFlags.field.swarm_retrieval_contextual_prefix.label": "Contextual prefix",
  "featureFlags.field.swarm_retrieval_contextual_prefix.hint":
    "Prepend a document-level summary to each chunk at indexing time.",
  "featureFlags.field.swarm_retrieval_knowledge_graph.label":
    "Knowledge graph expansion",
  "featureFlags.field.swarm_retrieval_knowledge_graph.hint":
    "Follow wikilinks to neighbouring chunks during search.",
  "featureFlags.field.swarm_retrieval_self_rag.label": "Self-RAG necessity gate",
  "featureFlags.field.swarm_retrieval_self_rag.hint":
    "Skip retrieval when the model decides it has enough context already.",
  "featureFlags.field.swarm_retrieval_hyde.label": "HyDE hypothetical answer",
  "featureFlags.field.swarm_retrieval_hyde.hint":
    "Generate a hypothetical answer first and embed that for retrieval.",
  "featureFlags.field.swarm_retrieval_incremental_indexing.label":
    "Incremental embedding cache",
  "featureFlags.field.swarm_retrieval_incremental_indexing.hint":
    "Reuse embeddings across runs via a content-hash keyed cache.",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.label": "Embedding profile",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.hint":
    "Embedding model profile used during indexing. Changing this invalidates the index cache.",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.general":
    "general (default, all-MiniLM-L6-v2)",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.code":
    "code (jina-embeddings-v2-base-code)",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.multilingual":
    "multilingual (paraphrase-multilingual-MiniLM-L12-v2)",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.label": "Chunking policy",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.hint":
    "How wiki documents are split into chunks. Changing this invalidates the index cache.",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.option.context-aware-default":
    "context-aware-default (boundary-aware splitter)",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.option.code-large-blocks":
    "code-large-blocks (large chunks, code-fence-first)",
  "featureFlags.field.swarm_retrieval_duplicate_collapse_threshold.label":
    "Duplicate collapse threshold",
  "featureFlags.field.swarm_retrieval_duplicate_collapse_threshold.hint":
    "Cosine similarity threshold for near-duplicate chunk removal at index time (0 = off, 0.95 = typical).",
};

export const featureFlagsRetrievalRu: Messages = {
  "featureFlags.field.swarm_retrieval_rerank_model_id.label": "Идентификатор реранкера",
  "featureFlags.field.swarm_retrieval_rerank_model_id.hint":
    "HuggingFace cross-encoder id (пустое значение отключает реранкинг).",
  "featureFlags.field.swarm_retrieval_query_rewrite_model.label":
    "Модель перезаписи запроса",
  "featureFlags.field.swarm_retrieval_query_rewrite_model.hint":
    "Модель для перезаписи/расширения запроса перед retrieval. Пусто = без изменений.",
  "featureFlags.field.swarm_retrieval_multi_query_count.label": "Число мульти-запросов",
  "featureFlags.field.swarm_retrieval_multi_query_count.hint":
    "Сколько вариантов запроса генерировать и объединять (1 = выключено, макс 5).",
  "featureFlags.field.swarm_retrieval_recency_half_life_days.label":
    "Период полураспада (дни)",
  "featureFlags.field.swarm_retrieval_recency_half_life_days.hint":
    "Период полураспада в днях для буста по свежести (0 = выключено; по умолчанию 30).",
  "featureFlags.field.swarm_retrieval_hyde_model.label": "HyDE-модель",
  "featureFlags.field.swarm_retrieval_hyde_model.hint":
    "Модель для генерации гипотетического ответа для HyDE retrieval.",
  "featureFlags.field.swarm_retrieval_query_rewrite.label": "Перезапись запроса",
  "featureFlags.field.swarm_retrieval_query_rewrite.hint":
    "LLM переписывает каждый запрос перед retrieval.",
  "featureFlags.field.swarm_retrieval_contextual_prefix.label": "Контекстный префикс",
  "featureFlags.field.swarm_retrieval_contextual_prefix.hint":
    "Префиксовать каждый chunk сводкой документа на этапе индексации.",
  "featureFlags.field.swarm_retrieval_knowledge_graph.label":
    "Расширение knowledge graph",
  "featureFlags.field.swarm_retrieval_knowledge_graph.hint":
    "Идти по wikilinks к соседним chunks во время поиска.",
  "featureFlags.field.swarm_retrieval_self_rag.label": "Self-RAG необходимость",
  "featureFlags.field.swarm_retrieval_self_rag.hint":
    "Пропускать retrieval, если модель считает, что контекста уже достаточно.",
  "featureFlags.field.swarm_retrieval_hyde.label": "HyDE гипотетический ответ",
  "featureFlags.field.swarm_retrieval_hyde.hint":
    "Сначала сгенерировать гипотетический ответ и эмбедить его для retrieval.",
  "featureFlags.field.swarm_retrieval_incremental_indexing.label":
    "Инкрементальный кэш эмбеддингов",
  "featureFlags.field.swarm_retrieval_incremental_indexing.hint":
    "Переиспользовать эмбеддинги между запусками через content-hash кэш.",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.label":
    "Профиль эмбеддингов",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.hint":
    "Модель эмбеддингов при индексировании. Изменение сбрасывает кэш индекса.",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.general":
    "general (по умолчанию, all-MiniLM-L6-v2)",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.code":
    "code (jina-embeddings-v2-base-code)",
  "featureFlags.field.swarm_retrieval_embedding_profile_id.option.multilingual":
    "multilingual (paraphrase-multilingual-MiniLM-L12-v2)",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.label": "Политика чанкинга",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.hint":
    "Метод разбиения wiki-документов на чанки. Изменение сбрасывает кэш индекса.",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.option.context-aware-default":
    "context-aware-default (граничный сплиттер)",
  "featureFlags.field.swarm_retrieval_chunking_policy_id.option.code-large-blocks":
    "code-large-blocks (крупные блоки, code-fence первый)",
  "featureFlags.field.swarm_retrieval_duplicate_collapse_threshold.label":
    "Порог удаления дубликатов",
  "featureFlags.field.swarm_retrieval_duplicate_collapse_threshold.hint":
    "Порог косинусного сходства для удаления похожих чанков при индексировании (0 = выключено, 0.95 = типичное значение).",
};
