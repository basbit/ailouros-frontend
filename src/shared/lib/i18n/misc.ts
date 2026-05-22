import type { Messages } from "./types";

export const miscEn: Messages = {
  "errors.duplicateProfileId": "Duplicate remote profile id: {ids}",
  "errors.invalidMcpJson": "Invalid MCP JSON: {message}",
  "errors.invalidMcpShape":
    'MCP JSON must contain a non-empty "servers" array or an "mcpServers" object.',
  "errors.addPipelineStep": "Add at least one pipeline step",
  "errors.invalidProfileId":
    "Invalid profile id (start with a letter, then letters/digits/_/-): {ids}",
  "errors.selectCloudProfile": "Choose a provider profile for cloud",
  "errors.unknownEnv": "Unknown env: {env}",
  "errors.profileMissingProvider": "Provider profile is missing a provider",
  "errors.noModelsForProvider": "No models returned from provider {provider}",
  "errors.noModelsForEnv": "No models returned from {provider}",
  "diffViewer.filesChanged": "file(s) changed",
  "diffViewer.noGit": "git unavailable — showing changed files",
  "diffViewer.editFile": "Edit",
  "diffViewer.saveFile": "Save",
  "diffViewer.cancelEdit": "Cancel",
  "wikiGraph.title": "Knowledge Graph",
  "wikiGraph.refresh": "Refresh",
  "wikiGraph.loading": "Building graph\u2026",
  "wikiGraph.empty":
    "No wiki articles yet. They will be created automatically as agents complete tasks.",
  "wikiGraph.searchPlaceholder": "Search nodes\u2026",
  "wikiGraph.nodeCount": "{n} nodes",
  "globalSettings.summary": "Internet Search & MCP",
  "globalSettings.allProjects": "all projects",
  "globalSettings.allProjectsTitle":
    "Shared across all projects — set once, used everywhere",
  "globalSettings.hint":
    "Web search API keys are shared across all projects. Keys are saved in the browser and synced to the server.",
  "localModels.summary": "Local Models (llama.cpp)",
  "localModels.scopeBadge": "desktop",
  "localModels.desktopOnly":
    "Local model management is only available in the AIlourOS desktop app.",
  "localModels.intro":
    "Models bundled with the desktop installer. Cloud and external runtime providers (Ollama, LM Studio) remain available in the agent role settings.",
  "localModels.loading": "Loading model list…",
  "localModels.empty": "No models declared in the installer manifest.",
  "localModels.retry": "Retry",
  "localModels.defaultBadge": "default",
  "localModels.installedBadge": "installed",
  "localModels.download": "Download",
  "localModels.downloading": "Downloading… {percent}%",
  "firstRun.title": "Setting up AIlourOS",
  "firstRun.intro":
    "First launch — staging the local runtime and the default model. You can keep using the rest of the app while this runs.",
  "firstRun.skipModel": "Skip default model",
  "firstRun.retryModel": "Retry download",
  "firstRun.continue": "Continue",
  "firstRun.llmPaths.title": "Choose how to provide an LLM",
  "firstRun.llmPaths.downloadDefault.title": "Download default GGUF (~5.3 GB)",
  "firstRun.llmPaths.downloadDefault.detail":
    "Run inference locally through bundled llama.cpp. Best for offline use.",
  "firstRun.llmPaths.localServer.title": "Use a local LLM server",
  "firstRun.llmPaths.localServer.notDetected":
    "No Ollama or LM Studio detected on localhost.",
  "firstRun.llmPaths.cloud.title": "Use a cloud API",
  "firstRun.llmPaths.cloud.detail":
    "Configure Anthropic / OpenAI / OpenRouter / Gemini in Settings after onboarding.",
  "firstRun.stage.preparingTree": "Preparing application directories",
  "firstRun.stage.fetchingPython": "Python runtime",
  "firstRun.stage.creatingVenv": "Backend Python environment",
  "firstRun.stage.installingBackend": "Backend dependencies",
  "firstRun.stage.stagingLlamaCpp": "Local inference engine",
  "firstRun.stage.stagingMcpRuntimes": "MCP runtimes (uv, node)",
  "firstRun.stage.downloadingModel": "Default model (Gemma 4 E4B)",
  "firstRun.stage.ready": "Ready",
  "firstRun.state.pending": "pending",
  "firstRun.state.active": "in progress",
  "firstRun.state.done": "done",
  "firstRun.state.skipped": "skipped",
  "firstRun.state.error": "error",
  "activeModel.local": "Local",
  "activeModel.cloud": "Cloud",
  "activeModel.none": "Not selected",
  "activeModel.openSettings": "Open Local Models settings",
};

export const miscRu: Messages = {
  "errors.duplicateProfileId": "Дублирующийся id remote profile: {ids}",
  "errors.invalidMcpJson": "Неверный MCP JSON: {message}",
  "errors.invalidMcpShape":
    'MCP JSON должен содержать непустой массив "servers" или объект "mcpServers".',
  "errors.addPipelineStep": "Добавь хотя бы один шаг пайплайна",
  "errors.invalidProfileId":
    "Неверный profile id (сначала буква, затем буквы/цифры/_/-): {ids}",
  "errors.selectCloudProfile": "Выберите профиль провайдера для cloud",
  "errors.unknownEnv": "Неизвестный env: {env}",
  "errors.profileMissingProvider": "У профиля не задан провайдер",
  "errors.noModelsForProvider": "Провайдер {provider} не вернул список моделей",
  "errors.noModelsForEnv": "{provider} не вернул список моделей",
  "diffViewer.filesChanged":
    "\u0444\u0430\u0439\u043b(\u043e\u0432) \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u043e",
  "diffViewer.noGit":
    "git \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u2014 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c \u0441\u043f\u0438\u0441\u043e\u043a \u0444\u0430\u0439\u043b\u043e\u0432",
  "diffViewer.editFile":
    "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c",
  "diffViewer.saveFile": "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
  "diffViewer.cancelEdit": "\u041e\u0442\u043c\u0435\u043d\u0430",
  "wikiGraph.title": "\u0413\u0440\u0430\u0444 \u0437\u043d\u0430\u043d\u0438\u0439",
  "wikiGraph.refresh": "\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c",
  "wikiGraph.loading":
    "\u0421\u0442\u0440\u043e\u0438\u043c \u0433\u0440\u0430\u0444\u2026",
  "wikiGraph.empty":
    "\u0421\u0442\u0430\u0442\u0435\u0439 \u0432\u0438\u043a\u0438 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442. \u041e\u043d\u0438 \u0431\u0443\u0434\u0443\u0442 \u0441\u043e\u0437\u0434\u0430\u0432\u0430\u0442\u044c\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043f\u043e \u043c\u0435\u0440\u0435 \u0440\u0430\u0431\u043e\u0442\u044b \u0430\u0433\u0435\u043d\u0442\u043e\u0432.",
  "wikiGraph.searchPlaceholder":
    "\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u0443\u0437\u043b\u0430\u043c\u2026",
  "wikiGraph.nodeCount": "\u0443\u0437\u043b\u043e\u0432: {n}",
  "localModels.summary": "Локальные модели (llama.cpp)",
  "localModels.scopeBadge": "desktop",
  "localModels.desktopOnly":
    "Управление локальными моделями доступно только в десктоп-приложении AIlourOS.",
  "localModels.intro":
    "Модели, поставляемые с десктоп-инсталлером. Облачные и внешние провайдеры (Ollama, LM Studio) остаются доступны в настройках ролей агентов.",
  "localModels.loading": "Загружаем список моделей…",
  "localModels.empty": "В манифесте инсталлера нет моделей.",
  "localModels.retry": "Повторить",
  "localModels.defaultBadge": "по умолчанию",
  "localModels.installedBadge": "установлена",
  "localModels.download": "Скачать",
  "localModels.downloading": "Загрузка… {percent}%",
  "firstRun.title": "Настраиваем AIlourOS",
  "firstRun.intro":
    "Первый запуск — разворачиваем локальный рантайм и модель по умолчанию. Остальные функции приложения уже доступны.",
  "firstRun.skipModel": "Пропустить модель",
  "firstRun.llmPaths.title": "Как подключить LLM",
  "firstRun.llmPaths.downloadDefault.title": "Скачать GGUF по умолчанию (~5.3 ГБ)",
  "firstRun.llmPaths.downloadDefault.detail":
    "Локальный inference через встроенный llama.cpp. Подойдёт для оффлайна.",
  "firstRun.llmPaths.localServer.title": "Подключить локальный LLM-сервер",
  "firstRun.llmPaths.localServer.notDetected":
    "Ollama или LM Studio на localhost не обнаружены.",
  "firstRun.llmPaths.cloud.title": "Использовать облачный API",
  "firstRun.llmPaths.cloud.detail":
    "Настроить Anthropic / OpenAI / OpenRouter / Gemini в настройках после онбординга.",
  "firstRun.retryModel": "Повторить загрузку",
  "firstRun.continue": "Продолжить",
  "firstRun.stage.preparingTree": "Создание директорий",
  "firstRun.stage.fetchingPython": "Python runtime",
  "firstRun.stage.creatingVenv": "Окружение бекенда",
  "firstRun.stage.installingBackend": "Зависимости бекенда",
  "firstRun.stage.stagingLlamaCpp": "Локальный inference engine",
  "firstRun.stage.stagingMcpRuntimes": "MCP runtimes (uv, node)",
  "firstRun.stage.downloadingModel": "Модель по умолчанию (Gemma 4 E4B)",
  "firstRun.stage.ready": "Готово",
  "firstRun.state.pending": "ожидает",
  "firstRun.state.active": "в процессе",
  "firstRun.state.done": "готово",
  "firstRun.state.skipped": "пропущено",
  "firstRun.state.error": "ошибка",
  "activeModel.local": "Локальная",
  "activeModel.cloud": "Облако",
  "activeModel.none": "Не выбрано",
  "activeModel.openSettings": "Открыть настройки локальных моделей",
  "globalSettings.summary": "Поиск в интернете и MCP",
  "globalSettings.allProjects": "все проекты",
  "globalSettings.allProjectsTitle":
    "Общие настройки для всех проектов — задаются один раз",
  "globalSettings.hint":
    "API-ключи для поиска в интернете общие для всех проектов. Сохраняются в браузере и синхронизируются с сервером.",
};
