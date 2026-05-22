import type { Messages } from "./types";

export const pipelineEn: Messages = {
  "graph.title": "Pipeline",
  "graph.layout": "Layout",
  "graph.layoutHelp":
    "Topology shapes both the layout and how steps run: parallel groups BA∥Architect into a concurrent stage; mesh runs Dev subtasks in parallel; linear and ring keep steps sequential. If you manually grouped steps in the editor, that grouping wins.",
  "graph.empty": "No steps configured",
  "graph.add": "Add step",
  "graph.reset": "Reset to default",
  "graph.resetRecommended": "Use recommended",
  "graph.resetRecommendedTitle":
    "Replace your current pipeline with the minimal recommended set for this topology (drops reviewers and human gates you can add back individually).",
  "graph.pipelineHeavyHint":
    "Your pipeline has {n} steps — the recommended minimum for this topology is {recommended}. Extra reviewers/human gates slow local models and burn tokens.",
  "graph.scenarioLabel": "Scenario",
  "graph.customScenario": "Custom",
  "graph.customScenarioCurrent": "Unsaved custom",
  "graph.customScenarioSelect": "Saved custom scenarios",
  "graph.saveCustomScenario": "Save custom",
  "graph.saveCustomScenarioTitle": "Save custom scenario",
  "graph.saveCustomScenarioMessage": "Name this custom pipeline.",
  "graph.customScenarioDefaultName": "Custom scenario",
  "graph.saveCustomScenarioSaved": "Custom scenario saved",
  "graph.saveCustomScenarioEmpty": "Add at least one pipeline step first.",
  "graph.copyToCustom": "Copy to Custom",
  "graph.copyToCustomTitle":
    "Copy this scenario's steps into the Custom editor and switch to Custom for further tweaks.",
  "graph.badges.writes": "writes files",
  "graph.badges.readonly": "read-only",
  "graph.badges.steps": "{n} steps",
  "graph.badges.toolWarn":
    "This tool is required by the scenario but not currently configured.",
  "pipelineSteps.orderWarningTitle": "Pipeline step order looks broken",
  "pipelineSteps.orderWarningPrompt": "Run anyway?",
  "pipelineSteps.orderWarningCancelled":
    "Run cancelled — fix the step order and try again.",
  "pipelineSteps.orderWarningTooltip": "{prerequisite} must run before this step",
  "retryGate.title": "Pipeline failed — retry from step:",
  "retryGate.hint":
    "Change agent models in the config above if needed, then retry from the failed step.",
  "retryGate.retryFailed": "↻ Retry from failed step",
  "retryGate.retryStart": "↻ Retry from beginning",
  "retryGate.continueAdd": "+ Continue (add steps)",
  "retryGate.selectAdditional":
    "Select additional steps to append to the current pipeline:",
  "retryGate.confirmContinue": "▶ Confirm & continue",
  "retryGate.confirmRestart": "Discard progress and restart?",
  "retryGate.confirmRestartYes": "Yes, restart",
};

export const pipelineRu: Messages = {
  "graph.title": "Пайплайн",
  "graph.layout": "Вид",
  "graph.layoutHelp":
    "Топология задаёт и вид, и то как шаги реально исполняются: parallel объединяет BA∥Architect в параллельный этап; mesh параллелит Dev-подзадачи; linear и ring идут последовательно. Если вы вручную сгруппировали шаги в редакторе — ваша группировка важнее пресета.",
  "graph.empty": "Шаги не настроены",
  "graph.add": "Добавить шаг",
  "graph.reset": "Сбросить к умолчанию",
  "graph.resetRecommended": "Оставить рекомендованные",
  "graph.resetRecommendedTitle":
    "Заменить текущий пайплайн минимальным рекомендованным набором для этой топологии (убирает ревьюеров и human-gate — можно добавить обратно по одному).",
  "graph.pipelineHeavyHint":
    "В пайплайне {n} шагов — рекомендованный минимум для этой топологии — {recommended}. Лишние ревьюеры/human-gate замедляют локальные модели и тратят токены.",
  "graph.scenarioLabel": "Сценарий",
  "graph.customScenario": "Свой",
  "graph.customScenarioCurrent": "Несохранённый свой",
  "graph.customScenarioSelect": "Сохранённые свои сценарии",
  "graph.saveCustomScenario": "Сохранить свой",
  "graph.saveCustomScenarioTitle": "Сохранить свой сценарий",
  "graph.saveCustomScenarioMessage": "Назовите этот пайплайн.",
  "graph.customScenarioDefaultName": "Свой сценарий",
  "graph.saveCustomScenarioSaved": "Свой сценарий сохранён",
  "graph.saveCustomScenarioEmpty": "Сначала добавьте хотя бы один шаг пайплайна.",
  "graph.copyToCustom": "В свой пайплайн",
  "graph.copyToCustomTitle":
    "Скопировать шаги этого сценария в редактор «Свой» и переключиться на него для дальнейшей правки.",
  "graph.badges.writes": "пишет файлы",
  "graph.badges.readonly": "только чтение",
  "graph.badges.steps": "{n} шагов",
  "graph.badges.toolWarn": "Этот инструмент требуется сценарию, но не настроен.",
  "pipelineSteps.orderWarningTitle": "Похоже, порядок шагов сломан",
  "pipelineSteps.orderWarningPrompt": "Всё равно запустить?",
  "pipelineSteps.orderWarningCancelled":
    "Запуск отменён — поправьте порядок шагов и попробуйте снова.",
  "pipelineSteps.orderWarningTooltip": "{prerequisite} должен идти раньше этого шага",
  "retryGate.title": "Пайплайн завершился с ошибкой — повторить с шага:",
  "retryGate.hint":
    "При необходимости поменяй модели агентов в конфиге выше, затем повтори запуск с упавшего шага.",
  "retryGate.retryFailed": "↻ Повторить с упавшего шага",
  "retryGate.retryStart": "↻ Повторить с начала",
  "retryGate.continueAdd": "+ Продолжить (добавить шаги)",
  "retryGate.selectAdditional":
    "Выбери дополнительные шаги, которые нужно дописать в текущий pipeline:",
  "retryGate.confirmContinue": "▶ Подтвердить и продолжить",
  "retryGate.confirmRestart": "Потерять прогресс и запустить заново?",
  "retryGate.confirmRestartYes": "Да, с начала",
};
