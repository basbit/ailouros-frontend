import type { Messages } from "./types";

export const settingsLiveEn: Messages = {
  "settingsField.source.env": "set via .env — edit to override",
  "settingsField.source.envSecret": "set in the server environment (.env) — enter a value to override",
  "settingsField.restart.badge": "restart required",
  "settingsField.restart.hint":
    "The running server reads this only when it starts; a change applies after a restart.",
  "settingsField.restart.pending":
    "Restart the server to apply: {names}. These settings are read only when the server starts; everything else already applies.",
  "settingsField.prerequisite.open": "Open the setting",
  "envCatalog.restartRequired": "restart required",
  "envCatalog.restartPending": "restart pending",

  "settings.subnav.agentic": "Autonomous work",
  "settings.agentic.title": "Autonomous work",
  "settings.agentic.subtitle":
    "Features that run or change code without you at the keyboard: scheduled goals, autoresearch, workspace isolation, and what runs learn from earlier ones. Every change applies at once.",
  "settings.agentic.scheduler.legend": "Goal scheduler",
  "settings.agentic.scheduler.intro":
    "Starts a pipeline run for every active goal with a cron trigger. Turning it off stops the scheduler; a timezone or grace change rebuilds it without double-starting a slot.",
  "settings.agentic.scheduler.enabled.label": "Run scheduled goals",
  "settings.agentic.scheduler.enabled.help": "Starts or stops the scheduler immediately.",
  "settings.agentic.scheduler.timezone.label": "Default timezone",
  "settings.agentic.scheduler.timezone.help":
    "IANA name (e.g. Europe/Berlin) for goals that do not set their own.",
  "settings.agentic.scheduler.grace.label": "Misfire grace (seconds)",
  "settings.agentic.scheduler.grace.help":
    "How late a fire may still start its run (default 60).",
  "settings.agentic.scheduler.needsWrite":
    "Scheduled runs write code in a worktree, but workspace writes are off — their changes will not be written.",
  "settings.agentic.autoresearch.legend": "Autoresearch",
  "settings.agentic.autoresearch.intro":
    "Measures a metric command in a worktree, keeps the edits that improve it and reverts the rest. It needs the two permissions below; prompt-eval sessions need only workspace writes.",
  "settings.agentic.autoresearch.write.label": "Allow workspace writes",
  "settings.agentic.autoresearch.write.help":
    "Lets agents and autoresearch edit files in the workspace.",
  "settings.agentic.autoresearch.exec.label": "Allow command execution",
  "settings.agentic.autoresearch.exec.help":
    "Lets agents and autoresearch metric/guard commands start processes (redacted environment, workspace only).",
  "settings.agentic.autoresearch.allowlist.label": "Shell allowlist",
  "settings.agentic.autoresearch.allowlist.help":
    "Comma-separated programs a command may start, e.g. pytest,npm,node. The metric command's program must be listed.",
  "settings.agentic.autoresearch.context.label": "Researcher context size (characters)",
  "settings.agentic.autoresearch.context.help":
    "How much of the mutable files the researcher sees per iteration; read again every iteration.",
  "settings.agentic.isolation.legend": "Workspace isolation",
  "settings.agentic.isolation.mode.label": "Isolation for chat runs",
  "settings.agentic.isolation.mode.help":
    "worktree = each run writes on its own branch in .swarm/worktrees; none = in your checkout. Scheduled, /run and autopilot runs always use a worktree.",
  "settings.agentic.isolation.default": "default (none)",
  "settings.agentic.isolation.none": "none — write in the checkout",
  "settings.agentic.isolation.worktree": "worktree — a branch per run",
  "settings.agentic.learning.legend": "Learning from earlier runs",
  "settings.agentic.learning.crossTask.label": "Cross-task memory",
  "settings.agentic.learning.crossTask.help":
    "Injects what earlier runs of this workspace learned into the next run.",
  "settings.agentic.learning.injectSteps.label": "Steps that get cross-task memory",
  "settings.agentic.learning.injectSteps.help":
    "Comma-separated step ids; empty = the default set.",
  "settings.agentic.learning.injectSteps.needsMemory":
    "Cross-task memory is off, so no step gets it.",
  "settings.agentic.learning.feedback.label": "Past feedback per file (dev prompt)",
  "settings.agentic.learning.feedback.help":
    "How many of your earlier verdicts on a file the dev step sees (codegen feedback); 0 = none.",
  "settings.agentic.elsewhere.legend": "Configured elsewhere",
  "settings.agentic.elsewhere.remote":
    "Telegram /run and the signed approve / continue / cancel links",
  "settings.agentic.elsewhere.autopilot": "Starting runs from GitHub / Linear issues",
  "settings.agentic.elsewhere.notifications": "Notices when a run pauses",
  "settings.agentic.elsewhere.promptEval": "Prompt eval has no settings: it uses the role models you run with.",

  "settings.pauseNotices.legend": "Run pauses",
  "settings.pauseNotices.intro":
    "Every pause of a run (human gate, phase gate, a run that stops for a human, a clarification) sends one notice with the run page link.",
  "settings.pauseNotices.needsNotify": "Notifications are off, so no pause notice is sent.",
  "settings.pauseNotices.needsChannel": "No channel is configured, so pause notices go nowhere.",
  "settings.pauseNotices.needsSignedLinks":
    "Signed links are off, so notices carry no Approve / Continue / Cancel buttons.",
  "settings.pauseNotices.ready":
    "Pause notices are on and carry signed Approve / Continue / Cancel buttons.",

  "remoteControl.run.needsBot": "The Telegram bot is off, so nobody can /run.",
  "remoteControl.bot.cancel.needsSignedLinks":
    "/cancel replies with a signed link: turn on signed action links (with a secret and an https base URL), or the links will not open.",

  "autoresearch.prerequisite.exec":
    "Command execution is off: a metric or guard command cannot run.",
  "autoresearch.prerequisite.write":
    "Workspace writes are off: autoresearch cannot edit files.",
  "autoresearch.prerequisite.allowlist":
    "The metric command's program is not in the shell allowlist.",
};

export const settingsLiveRu: Messages = {
  "settingsField.source.env": "задано в .env — измените, чтобы переопределить",
  "settingsField.source.envSecret": "задано в окружении сервера (.env) — введите значение, чтобы переопределить",
  "settingsField.restart.badge": "нужен перезапуск",
  "settingsField.restart.hint":
    "Запущенный сервер читает это только при старте; изменение применится после перезапуска.",
  "settingsField.restart.pending":
    "Перезапустите сервер, чтобы применить: {names}. Эти настройки читаются только при старте; всё остальное уже применено.",
  "settingsField.prerequisite.open": "Открыть настройку",
  "envCatalog.restartRequired": "нужен перезапуск",
  "envCatalog.restartPending": "ждёт перезапуска",

  "settings.subnav.agentic": "Автономная работа",
  "settings.agentic.title": "Автономная работа",
  "settings.agentic.subtitle":
    "Функции, которые запускают или меняют код без вас: цели по расписанию, авто-исследование, изоляция рабочей копии и память между прогонами. Изменения применяются сразу.",
  "settings.agentic.scheduler.legend": "Планировщик целей",
  "settings.agentic.scheduler.intro":
    "Запускает прогон для каждой активной цели с cron-триггером. Выключение останавливает планировщик; смена часового пояса или допуска пересобирает его без повторного запуска слота.",
  "settings.agentic.scheduler.enabled.label": "Запускать цели по расписанию",
  "settings.agentic.scheduler.enabled.help": "Запускает или останавливает планировщик сразу.",
  "settings.agentic.scheduler.timezone.label": "Часовой пояс по умолчанию",
  "settings.agentic.scheduler.timezone.help":
    "Имя IANA (например, Europe/Berlin) для целей без собственного пояса.",
  "settings.agentic.scheduler.grace.label": "Допуск опоздания (секунды)",
  "settings.agentic.scheduler.grace.help":
    "Насколько поздно срабатывание ещё может запустить прогон (по умолчанию 60).",
  "settings.agentic.scheduler.needsWrite":
    "Прогоны по расписанию пишут код в worktree, но запись в рабочую копию выключена — их изменения не будут записаны.",
  "settings.agentic.autoresearch.legend": "Авто-исследование",
  "settings.agentic.autoresearch.intro":
    "Измеряет метрику командой в worktree, оставляет улучшающие правки и откатывает остальные. Нужны два разрешения ниже; сессиям prompt-eval нужна только запись.",
  "settings.agentic.autoresearch.write.label": "Разрешить запись в рабочую копию",
  "settings.agentic.autoresearch.write.help":
    "Позволяет агентам и авто-исследованию править файлы рабочей копии.",
  "settings.agentic.autoresearch.exec.label": "Разрешить запуск команд",
  "settings.agentic.autoresearch.exec.help":
    "Позволяет агентам и командам метрики/проверки авто-исследования запускать процессы (очищенное окружение, только в рабочей копии).",
  "settings.agentic.autoresearch.allowlist.label": "Разрешённые программы",
  "settings.agentic.autoresearch.allowlist.help":
    "Программы через запятую, например pytest,npm,node. Программа команды метрики должна быть в списке.",
  "settings.agentic.autoresearch.context.label": "Контекст исследователя (символы)",
  "settings.agentic.autoresearch.context.help":
    "Сколько изменяемых файлов видит исследователь за итерацию; читается заново на каждой итерации.",
  "settings.agentic.isolation.legend": "Изоляция рабочей копии",
  "settings.agentic.isolation.mode.label": "Изоляция для прогонов из чата",
  "settings.agentic.isolation.mode.help":
    "worktree — каждый прогон пишет в свою ветку в .swarm/worktrees; none — прямо в вашу рабочую копию. Прогоны по расписанию, /run и автопилота всегда идут в worktree.",
  "settings.agentic.isolation.default": "по умолчанию (none)",
  "settings.agentic.isolation.none": "none — писать в рабочую копию",
  "settings.agentic.isolation.worktree": "worktree — ветка на прогон",
  "settings.agentic.learning.legend": "Опыт прошлых прогонов",
  "settings.agentic.learning.crossTask.label": "Память между задачами",
  "settings.agentic.learning.crossTask.help":
    "Передаёт в следующий прогон то, что выучили прошлые прогоны этой рабочей копии.",
  "settings.agentic.learning.injectSteps.label": "Шаги, получающие память между задачами",
  "settings.agentic.learning.injectSteps.help":
    "Идентификаторы шагов через запятую; пусто — набор по умолчанию.",
  "settings.agentic.learning.injectSteps.needsMemory":
    "Память между задачами выключена, её не получит ни один шаг.",
  "settings.agentic.learning.feedback.label": "Прошлые отзывы на файл (промпт dev)",
  "settings.agentic.learning.feedback.help":
    "Сколько ваших прошлых оценок файла видит шаг dev (обратная связь по коду); 0 — ни одной.",
  "settings.agentic.elsewhere.legend": "Настраивается в других разделах",
  "settings.agentic.elsewhere.remote":
    "Telegram /run и подписанные ссылки «одобрить / продолжить / отменить»",
  "settings.agentic.elsewhere.autopilot": "Запуск прогонов из задач GitHub / Linear",
  "settings.agentic.elsewhere.notifications": "Уведомления о паузах прогона",
  "settings.agentic.elsewhere.promptEval": "У prompt eval нет настроек: он использует модели ролей, с которыми вы запускаете.",

  "settings.pauseNotices.legend": "Паузы прогона",
  "settings.pauseNotices.intro":
    "Каждая пауза прогона (человеческий гейт, фазовый гейт, остановка в ожидании человека, уточнение) отправляет одно уведомление со ссылкой на страницу прогона.",
  "settings.pauseNotices.needsNotify": "Уведомления выключены, уведомления о паузах не отправляются.",
  "settings.pauseNotices.needsChannel": "Не настроен ни один канал, уведомления о паузах никуда не уходят.",
  "settings.pauseNotices.needsSignedLinks":
    "Подписанные ссылки выключены, в уведомлениях нет кнопок «Одобрить / Продолжить / Отменить».",
  "settings.pauseNotices.ready":
    "Уведомления о паузах включены и содержат подписанные кнопки «Одобрить / Продолжить / Отменить».",

  "remoteControl.run.needsBot": "Telegram-бот выключен, поэтому /run недоступен.",
  "remoteControl.bot.cancel.needsSignedLinks":
    "/cancel отвечает подписанной ссылкой: включите подписанные ссылки (с секретом и https-адресом), иначе ссылки не откроются.",

  "autoresearch.prerequisite.exec":
    "Запуск команд выключен: команда метрики или проверки не сможет выполниться.",
  "autoresearch.prerequisite.write":
    "Запись в рабочую копию выключена: авто-исследование не сможет править файлы.",
  "autoresearch.prerequisite.allowlist":
    "Программы команды метрики нет в списке разрешённых.",
};
