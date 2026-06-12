import type { Messages } from "./types";

export const featureFlagsMcpMemoryEn: Messages = {
  "featureFlags.field.swarm_mcp_auto.label": "MCP auto-discovery",
  "featureFlags.field.swarm_mcp_auto.hint":
    "Master switch — when on, the orchestrator picks up MCP servers automatically.",
  "featureFlags.field.swarm_fetch_page.label": "fetch_page tool",
  "featureFlags.field.swarm_fetch_page.hint":
    "Allow agents to download and read external web pages.",
  "featureFlags.field.swarm_git_mcp.label": "git MCP server",
  "featureFlags.field.swarm_git_mcp.hint":
    "Git tools (log, show, diff) over MCP. Requires uv on the host.",
  "featureFlags.field.swarm_github_mcp.label": "github MCP server",
  "featureFlags.field.swarm_github_mcp.hint":
    "GitHub API tools over MCP. Requires GITHUB_TOKEN.",
  "featureFlags.field.swarm_context7.label": "context7 docs server",
  "featureFlags.field.swarm_context7.hint": "Library documentation MCP server.",
  "featureFlags.field.swarm_mcp_cache.label": "MCP tool-call cache",
  "featureFlags.field.swarm_mcp_cache.hint":
    "Cache deterministic MCP tool results to save tokens on repeated calls.",
  "featureFlags.field.swarm_memory_tools.label": "Memory MCP tools",
  "featureFlags.field.swarm_memory_tools.hint":
    "Expose pattern_memory and cross_task_memory as MCP tools to agents.",
  "featureFlags.field.swarm_wiki_tools.label": "Wiki MCP tools",
  "featureFlags.field.swarm_wiki_tools.hint":
    "Expose wiki_search, wiki_read and wiki_write as MCP tools.",
  "featureFlags.field.swarm_vision_enabled.label": "Vision tools",
  "featureFlags.field.swarm_vision_enabled.hint":
    "Screenshot, PDF and whiteboard parsing via vision models.",
  "featureFlags.field.swarm_wiki_search_enabled.label": "Wiki retrieval",
  "featureFlags.field.swarm_wiki_search_enabled.hint":
    "Inject per-node wiki search hits into agent prompts.",
  "featureFlags.field.swarm_wiki_writer.label": "Wiki auto-writer",
  "featureFlags.field.swarm_wiki_writer.hint":
    "Write a wiki update at the end of every pipeline run.",
  "featureFlags.field.swarm_pattern_memory.label": "Pattern memory",
  "featureFlags.field.swarm_pattern_memory.hint":
    "Inject prior matching solutions into the prompt of each node.",
  "featureFlags.field.swarm_cross_task_memory.label": "Cross-task memory",
  "featureFlags.field.swarm_cross_task_memory.hint":
    "Recall and inject episodes from prior runs in the same workspace.",
  "featureFlags.field.swarm_retrieval_traces_enabled.label": "Retrieval traces",
  "featureFlags.field.swarm_retrieval_traces_enabled.hint":
    "Write a JSONL trace of every retrieval call for inspection in the E3 widget.",
  "featureFlags.field.swarm_retrieval_traces_max_per_workspace.label":
    "Retrieval traces cap",
  "featureFlags.field.swarm_retrieval_traces_max_per_workspace.hint":
    "Max traces kept per workspace before rotation.",
  "featureFlags.field.swarm_unified_memory_search.label": "Unified memory search",
  "featureFlags.field.swarm_unified_memory_search.hint":
    "Search wiki, pattern memory and cross-task memory through one ranker.",
  "featureFlags.field.swarm_code_rag_enabled.label": "Code RAG (index project source)",
  "featureFlags.field.swarm_code_rag_enabled.hint":
    "Index the target project's source code and retrieve the most relevant snippets into dev/architect/review prompts (more precise, fewer tokens than dumping files).",
  "featureFlags.field.swarm_code_rag_repomap.label": "Code RAG: repo map",
  "featureFlags.field.swarm_code_rag_repomap.hint":
    "Also include a token-budgeted tree-sitter repo map (key symbols ranked by PageRank). Requires tree-sitter language packs.",
};

export const featureFlagsMcpMemoryRu: Messages = {
  "featureFlags.field.swarm_mcp_auto.label": "MCP автообнаружение",
  "featureFlags.field.swarm_mcp_auto.hint":
    "Главный переключатель — оркестратор сам подбирает MCP-серверы.",
  "featureFlags.field.swarm_fetch_page.label": "Инструмент fetch_page",
  "featureFlags.field.swarm_fetch_page.hint":
    "Разрешить агентам скачивать и читать внешние веб-страницы.",
  "featureFlags.field.swarm_git_mcp.label": "git MCP-сервер",
  "featureFlags.field.swarm_git_mcp.hint":
    "Git-инструменты (log, show, diff) через MCP. Требует uv на хосте.",
  "featureFlags.field.swarm_github_mcp.label": "github MCP-сервер",
  "featureFlags.field.swarm_github_mcp.hint":
    "Инструменты GitHub API через MCP. Требует GITHUB_TOKEN.",
  "featureFlags.field.swarm_context7.label": "context7 docs-сервер",
  "featureFlags.field.swarm_context7.hint": "MCP-сервер документации библиотек.",
  "featureFlags.field.swarm_mcp_cache.label": "Кэш MCP-вызовов",
  "featureFlags.field.swarm_mcp_cache.hint":
    "Кэшировать детерминированные MCP-результаты, чтобы экономить токены.",
  "featureFlags.field.swarm_memory_tools.label": "Memory MCP-инструменты",
  "featureFlags.field.swarm_memory_tools.hint":
    "Открыть pattern_memory и cross_task_memory как MCP-инструменты.",
  "featureFlags.field.swarm_wiki_tools.label": "Wiki MCP-инструменты",
  "featureFlags.field.swarm_wiki_tools.hint":
    "Открыть wiki_search/wiki_read/wiki_write как MCP-инструменты.",
  "featureFlags.field.swarm_vision_enabled.label": "Vision-инструменты",
  "featureFlags.field.swarm_vision_enabled.hint":
    "Скриншоты, PDF и whiteboard через vision-модели.",
  "featureFlags.field.swarm_wiki_search_enabled.label": "Wiki retrieval",
  "featureFlags.field.swarm_wiki_search_enabled.hint":
    "Подставлять результаты wiki-поиска в промпт каждой ноды.",
  "featureFlags.field.swarm_wiki_writer.label": "Wiki авто-записи",
  "featureFlags.field.swarm_wiki_writer.hint":
    "Писать wiki-обновление в конце каждого pipeline-прогона.",
  "featureFlags.field.swarm_pattern_memory.label": "Pattern memory",
  "featureFlags.field.swarm_pattern_memory.hint":
    "Подставлять прошлые подходящие решения в промпт каждой ноды.",
  "featureFlags.field.swarm_cross_task_memory.label": "Cross-task память",
  "featureFlags.field.swarm_cross_task_memory.hint":
    "Подставлять эпизоды из предыдущих запусков в том же workspace.",
  "featureFlags.field.swarm_retrieval_traces_enabled.label": "Retrieval-трейсы",
  "featureFlags.field.swarm_retrieval_traces_enabled.hint":
    "Писать JSONL-трейс каждого retrieval-вызова для просмотра в E3-виджете.",
  "featureFlags.field.swarm_retrieval_traces_max_per_workspace.label":
    "Лимит retrieval-трейсов",
  "featureFlags.field.swarm_retrieval_traces_max_per_workspace.hint":
    "Сколько трейсов хранить на workspace до ротации.",
  "featureFlags.field.swarm_unified_memory_search.label": "Единый memory-поиск",
  "featureFlags.field.swarm_unified_memory_search.hint":
    "Искать одновременно по wiki, pattern memory и cross-task через один ранкер.",
  "featureFlags.field.swarm_code_rag_enabled.label": "Code RAG (индекс кода проекта)",
  "featureFlags.field.swarm_code_rag_enabled.hint":
    "Индексировать исходный код целевого проекта и подставлять самые релевантные фрагменты в промпты dev/architect/review (точнее и дешевле по токенам, чем дамп файлов).",
  "featureFlags.field.swarm_code_rag_repomap.label": "Code RAG: карта репозитория",
  "featureFlags.field.swarm_code_rag_repomap.hint":
    "Дополнительно включить token-budgeted карту репозитория (ключевые символы по PageRank, tree-sitter). Требует tree-sitter language packs.",
};
