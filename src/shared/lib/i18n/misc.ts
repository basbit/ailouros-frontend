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
  "diffViewer.title": "Changes",
  "diffViewer.filesChanged": "file(s) changed",
  "diffViewer.noGit": "git unavailable — showing changed files",
  "diffViewer.loading": "Loading diff\u2026",
  "diffViewer.noChanges": "No file changes detected.",
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
  "diffViewer.title": "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f",
  "diffViewer.filesChanged":
    "\u0444\u0430\u0439\u043b(\u043e\u0432) \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u043e",
  "diffViewer.noGit":
    "git \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u2014 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c \u0441\u043f\u0438\u0441\u043e\u043a \u0444\u0430\u0439\u043b\u043e\u0432",
  "diffViewer.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 diff\u2026",
  "diffViewer.noChanges":
    "\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0439 \u0444\u0430\u0439\u043b\u043e\u0432 \u043d\u0435 \u043e\u0431\u043d\u0430\u0440\u0443\u0436\u0435\u043d\u043e.",
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
  "globalSettings.summary": "Поиск в интернете и MCP",
  "globalSettings.allProjects": "все проекты",
  "globalSettings.allProjectsTitle":
    "Общие настройки для всех проектов — задаются один раз",
  "globalSettings.hint":
    "API-ключи для поиска в интернете общие для всех проектов. Сохраняются в браузере и синхронизируются с сервером.",
};
