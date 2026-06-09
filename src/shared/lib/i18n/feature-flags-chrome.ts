import type { Messages } from "./types";

export const featureFlagsChromeEn: Messages = {
  "featureFlags.badge.notWired.label": "Library only",
  "featureFlags.badge.notWired.hint":
    "Resolver exists, but no pipeline node calls it yet. Toggle is preserved for forward-compatibility; enabling it does not currently change pipeline behaviour.",
  "featureFlags.badge.workspaceOverride.label": "Workspace",
  "featureFlags.badge.workspaceOverride.hint":
    "This value is overridden for the current workspace. The global value is ignored when this workspace runs a pipeline.",
  "featureFlags.overrideToggle.label": "Override for this workspace",
  "featureFlags.group.mcp.title": "MCP servers",
  "featureFlags.group.mcp.description":
    "Filesystem, fetch_page, git, github and context7 MCP tools. Defaults are ON; the auto-config layer skips a server gracefully if its binary or credentials are missing.",
  "featureFlags.group.memory.title": "Wiki & memory",
  "featureFlags.group.memory.description":
    "Knowledge retrieval and learning across runs. Wiki search, retrieval traces, pattern memory and cross-task episodic memory.",
  "featureFlags.group.retrieval.title": "Advanced retrieval (Track D / E)",
  "featureFlags.group.retrieval.description":
    "Reranking, hierarchical retrieval, knowledge graphs, CRAG, Self-RAG, HyDE and other RAG quality features.",
  "featureFlags.group.reasoning.title": "Reasoning quality (Track G)",
  "featureFlags.group.reasoning.description":
    "Process reward modelling, verifier model and memory tier routing.",
  "featureFlags.group.efficiency.title": "Efficiency (Track H)",
  "featureFlags.group.efficiency.description":
    "Caching, batching and compression to reduce token usage and latency.",
  "featureFlags.group.evaluation.title": "Evaluation & observability (Track I)",
  "featureFlags.group.evaluation.description":
    "Ragas metrics, NLI entailment verification, sandbox execution and OpenTelemetry export.",
  "featureFlags.group.ux.title": "UX surfacing (Track J)",
  "featureFlags.group.ux.description":
    "Streaming partial RAG events, thumbs feedback, inline citations and follow-up suggestions.",
  "featureFlags.group.orchestration.title": "Orchestration (Track K)",
  "featureFlags.group.orchestration.description":
    "Skill dispatcher, quick-fix fast path, phase loop and spec linter.",
  "featureFlags.group.workspace.title": "Workspace lifecycle",
  "featureFlags.group.workspace.description":
    "Snapshots, write permissions and the long-running goal scheduler.",
};

export const featureFlagsChromeRu: Messages = {
  "featureFlags.badge.notWired.label": "Только библиотека",
  "featureFlags.badge.notWired.hint":
    "Resolver реализован, но pipeline-узел его пока не вызывает. Тоггл сохраняется для совместимости; включение пока не меняет поведение пайплайна.",
  "featureFlags.badge.workspaceOverride.label": "Workspace",
  "featureFlags.badge.workspaceOverride.hint":
    "Значение переопределено для текущего workspace. Глобальное значение игнорируется при запуске пайплайна из этого workspace.",
  "featureFlags.overrideToggle.label": "Переопределить для workspace",
  "featureFlags.group.mcp.title": "MCP-серверы",
  "featureFlags.group.mcp.description":
    "Filesystem, fetch_page, git, github и context7. По умолчанию включены; авто-конфиг тихо пропускает сервер при отсутствии бинаря или ключей.",
  "featureFlags.group.memory.title": "Wiki и память",
  "featureFlags.group.memory.description":
    "Поиск знаний и обучение между запусками: wiki, retrieval-трейсы, pattern memory, cross-task episodic memory.",
  "featureFlags.group.retrieval.title": "Продвинутый retrieval (Track D / E)",
  "featureFlags.group.retrieval.description":
    "Реранкинг, иерархический поиск, knowledge graphs, CRAG, Self-RAG, HyDE и другие RAG-улучшения.",
  "featureFlags.group.reasoning.title": "Качество рассуждений (Track G)",
  "featureFlags.group.reasoning.description":
    "Process reward modelling, verifier model и маршрутизация по уровням памяти.",
  "featureFlags.group.efficiency.title": "Эффективность (Track H)",
  "featureFlags.group.efficiency.description":
    "Кэширование, батчинг и сжатие для снижения токенов и латентности.",
  "featureFlags.group.evaluation.title": "Оценка и наблюдаемость (Track I)",
  "featureFlags.group.evaluation.description":
    "Ragas-метрики, NLI-entailment проверка, sandbox-исполнение и OpenTelemetry-экспорт.",
  "featureFlags.group.ux.title": "UX поверхности (Track J)",
  "featureFlags.group.ux.description":
    "Потоковые retrieval_done события, обратная связь, инлайн-цитаты и follow-up-предложения.",
  "featureFlags.group.orchestration.title": "Оркестрация (Track K)",
  "featureFlags.group.orchestration.description":
    "Skill dispatcher, quick-fix fast path, phase loop и spec linter.",
  "featureFlags.group.workspace.title": "Жизненный цикл workspace",
  "featureFlags.group.workspace.description":
    "Снимки, разрешения записи и долгоживущий планировщик целей.",
};
