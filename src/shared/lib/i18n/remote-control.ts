import type { Messages } from "./types";

export const remoteControlEn: Messages = {
  "settings.subnav.remoteControl": "Remote control",
  "settings.remoteControl.title": "Remote control",
  "settings.remoteControl.subtitle":
    "Answer pauses and start runs from outside this page: the Telegram bot and the signed approve / continue / cancel links in notifications. Every change applies at once — no restart.",

  "settingsField.secretSaved": "saved — type to replace",
  "settingsField.generate": "Generate",
  "settingsField.generatedHint": "New secret (shown once — copy it now):",
  "settingsField.copy": "Copy",
  "settingsField.copied": "Copied",
  "settingsField.saveFailed": "Settings were not saved: {reason}",

  "remoteControl.status.running": "Running",
  "remoteControl.status.stopped": "Stopped",
  "remoteControl.status.stopping": "Stopping",
  "remoteControl.status.error": "Error",
  "remoteControl.status.unknown": "Unknown",

  "remoteControl.bot.legend": "Telegram bot",
  "remoteControl.bot.intro":
    "A bot that answers /status, /help, /cancel and /run from the chats you allow. It starts, stops or restarts as soon as you change these fields; the badge shows its live state.",
  "remoteControl.bot.enabled.label": "Run the Telegram bot",
  "remoteControl.bot.enabled.help":
    "Starts polling Telegram for commands. Turning it off stops the bot after the poll in flight returns.",
  "remoteControl.bot.token.label": "Bot token",
  "remoteControl.bot.token.help":
    "The token @BotFather gave you. Stored on the server only and shown masked; a new token restarts the bot.",
  "remoteControl.bot.allowed.label": "Allowed chat IDs",
  "remoteControl.bot.allowed.help":
    "Comma-separated numeric chat IDs the bot answers at all; messages from any other chat are ignored. Empty = the bot answers nobody.",
  "remoteControl.bot.perMinute.label": "Messages per minute",
  "remoteControl.bot.perMinute.help": "Per-chat limit on commands per minute (1–600, default 30).",
  "remoteControl.bot.perHour.label": "Messages per hour",
  "remoteControl.bot.perHour.help": "Per-chat limit on commands per hour (1–10000, default 200).",
  "remoteControl.bot.pollTimeout.label": "Poll timeout, s",
  "remoteControl.bot.pollTimeout.help":
    "How long one Telegram long poll waits for a message (1–60, default 25). Also the longest a stop or restart waits.",
  "remoteControl.bot.cancel.label": "Allow /cancel",
  "remoteControl.bot.cancel.help":
    "Adds a /cancel command that replies with a signed cancel link. Needs signed action links below: an https public base URL and a secret.",
  "remoteControl.bot.cancelTtl.label": "Cancel link lifetime, s",
  "remoteControl.bot.cancelTtl.help": "How long a /cancel link stays valid (30–86400, default 300).",

  "remoteControl.run.legend": "Run from Telegram",
  "remoteControl.run.intro":
    "/run <task> starts a pipeline that writes code, always in its own worktree and branch of the repository chosen here. The chat cannot pick the repository or the scenario.",
  "remoteControl.run.chats.label": "Chats allowed to /run",
  "remoteControl.run.chats.help":
    "Comma-separated chat IDs that may start runs; each must also be in the allowed chat IDs. Empty = /run is refused everywhere. Use private chats only: in a group every member could start runs.",
  "remoteControl.run.workspace.label": "Repository for /run",
  "remoteControl.run.workspace.help":
    "Absolute path of a git repository inside the workspace base. Checked when you save.",
  "remoteControl.run.scenario.label": "Scenario for /run",
  "remoteControl.run.scenario.default": "Default (build_feature)",
  "remoteControl.run.scenario.help": "The pipeline every /run starts.",
  "remoteControl.run.scenario.loadFailed": "Could not load the scenario list: {reason}",
  "remoteControl.run.perHour.label": "Runs per hour per chat",
  "remoteControl.run.perHour.help":
    "How many /run starts one chat may make per hour (1–100, default 4); a chat never has more than one run at a time.",

  "remoteControl.links.legend": "Signed action links",
  "remoteControl.links.intro":
    "Notifications about a paused run carry signed Approve / Reject or Continue / Cancel buttons. Each opens a confirmation page; nothing happens until it is confirmed there.",
  "remoteControl.links.enabled.label": "Answer signed links",
  "remoteControl.links.enabled.help":
    "Turns the confirmation pages on. Off: links already sent answer 404 and new notifications carry no buttons.",
  "remoteControl.links.baseUrl.label": "Public base URL",
  "remoteControl.links.baseUrl.help":
    "The https:// address this server is reachable at from your phone. Used in link buttons, /cancel links and run-page links; without https no buttons are minted.",
  "remoteControl.links.secret.label": "Link signing secret",
  "remoteControl.links.secret.help":
    "HMAC secret that signs every link (at least 32 bytes). Generate replaces it — links already sent stop working; Rotate keeps them valid until they expire.",
  "remoteControl.links.rotate": "Rotate",
  "remoteControl.links.rotated":
    "Rotated: new links use the new secret, links already sent keep working until they expire.",
  "remoteControl.links.rotateFailed": "Rotation failed: {reason}",
  "remoteControl.links.ttl.label": "Link lifetime, s",
  "remoteControl.links.ttl.help":
    "How long approve / reject / continue / cancel links in notifications stay valid (60–604800, default 3600).",

  "settings.autopilot.secretsTitle": "Webhook secrets and limits",
  "settings.autopilot.secretsHint":
    "Enter the secret you set on the GitHub or Linear webhook, or generate one here and paste it there. Saved on the server only; a change applies to the next delivery.",
  "settings.autopilot.githubSecret.label": "GitHub webhook secret",
  "settings.autopilot.githubSecret.help":
    "Checks the X-Hub-Signature-256 of every GitHub delivery. Empty = the GitHub webhook answers 503.",
  "settings.autopilot.linearSecret.label": "Linear webhook signing secret",
  "settings.autopilot.linearSecret.help":
    "Checks the Linear-Signature of every Linear delivery. Empty = the Linear webhook answers 503.",
  "settings.autopilot.tolerance.label": "Linear clock tolerance, s",
  "settings.autopilot.tolerance.help":
    "A Linear delivery stamped further than this from the server clock is refused as a replay (1–3600, default 60).",
  "settings.autopilot.eventLogLimit.label": "Events kept",
  "settings.autopilot.eventLogLimit.help":
    "How many autorun events the log below keeps; older ones are dropped (default 200).",
  "settings.autopilot.ledgerLimit.label": "Delivery IDs remembered",
  "settings.autopilot.ledgerLimit.help":
    "How many webhook delivery IDs are remembered to ignore redeliveries (default 2000).",
};

export const remoteControlRu: Messages = {
  "settings.subnav.remoteControl": "Удалённое управление",
  "settings.remoteControl.title": "Удалённое управление",
  "settings.remoteControl.subtitle":
    "Отвечайте на паузы и запускайте прогоны не открывая эту страницу: Telegram-бот и подписанные ссылки «одобрить / продолжить / отменить» в уведомлениях. Изменения применяются сразу — без перезапуска.",

  "settingsField.secretSaved": "сохранён — введите новый, чтобы заменить",
  "settingsField.generate": "Сгенерировать",
  "settingsField.generatedHint": "Новый секрет (показан один раз — скопируйте сейчас):",
  "settingsField.copy": "Копировать",
  "settingsField.copied": "Скопировано",
  "settingsField.saveFailed": "Настройки не сохранены: {reason}",

  "remoteControl.status.running": "Работает",
  "remoteControl.status.stopped": "Остановлен",
  "remoteControl.status.stopping": "Останавливается",
  "remoteControl.status.error": "Ошибка",
  "remoteControl.status.unknown": "Неизвестно",

  "remoteControl.bot.legend": "Telegram-бот",
  "remoteControl.bot.intro":
    "Бот отвечает на /status, /help, /cancel и /run из разрешённых чатов. Он запускается, останавливается или перезапускается сразу при изменении этих полей; значок показывает его текущее состояние.",
  "remoteControl.bot.enabled.label": "Запустить Telegram-бота",
  "remoteControl.bot.enabled.help":
    "Начинает опрашивать Telegram. Выключение останавливает бота после завершения текущего опроса.",
  "remoteControl.bot.token.label": "Токен бота",
  "remoteControl.bot.token.help":
    "Токен, выданный @BotFather. Хранится только на сервере и показывается скрытым; новый токен перезапускает бота.",
  "remoteControl.bot.allowed.label": "Разрешённые ID чатов",
  "remoteControl.bot.allowed.help":
    "Числовые ID чатов через запятую, которым бот вообще отвечает; сообщения из других чатов игнорируются. Пусто — бот не отвечает никому.",
  "remoteControl.bot.perMinute.label": "Сообщений в минуту",
  "remoteControl.bot.perMinute.help": "Лимит команд в минуту на чат (1–600, по умолчанию 30).",
  "remoteControl.bot.perHour.label": "Сообщений в час",
  "remoteControl.bot.perHour.help": "Лимит команд в час на чат (1–10000, по умолчанию 200).",
  "remoteControl.bot.pollTimeout.label": "Таймаут опроса, с",
  "remoteControl.bot.pollTimeout.help":
    "Сколько один long poll Telegram ждёт сообщения (1–60, по умолчанию 25). Столько же максимум длится остановка или перезапуск.",
  "remoteControl.bot.cancel.label": "Разрешить /cancel",
  "remoteControl.bot.cancel.help":
    "Добавляет команду /cancel, которая присылает подписанную ссылку отмены. Нужны подписанные ссылки ниже: https-адрес сервера и секрет.",
  "remoteControl.bot.cancelTtl.label": "Срок ссылки отмены, с",
  "remoteControl.bot.cancelTtl.help": "Сколько действует ссылка /cancel (30–86400, по умолчанию 300).",

  "remoteControl.run.legend": "Запуск из Telegram",
  "remoteControl.run.intro":
    "/run <задача> запускает пайплайн, который пишет код, — всегда в отдельном worktree и ветке выбранного здесь репозитория. Чат не может выбрать репозиторий или сценарий.",
  "remoteControl.run.chats.label": "Чаты, которым разрешён /run",
  "remoteControl.run.chats.help":
    "ID чатов через запятую, которые могут запускать прогоны; каждый должен быть и в списке разрешённых. Пусто — /run запрещён везде. Только личные чаты: в группе запускать сможет любой участник.",
  "remoteControl.run.workspace.label": "Репозиторий для /run",
  "remoteControl.run.workspace.help":
    "Абсолютный путь к git-репозиторию внутри базовой папки воркспейсов. Проверяется при сохранении.",
  "remoteControl.run.scenario.label": "Сценарий для /run",
  "remoteControl.run.scenario.default": "По умолчанию (build_feature)",
  "remoteControl.run.scenario.help": "Пайплайн, который запускает каждый /run.",
  "remoteControl.run.scenario.loadFailed": "Не удалось загрузить список сценариев: {reason}",
  "remoteControl.run.perHour.label": "Запусков в час на чат",
  "remoteControl.run.perHour.help":
    "Сколько запусков /run один чат может сделать в час (1–100, по умолчанию 4); одновременно у чата не больше одного прогона.",

  "remoteControl.links.legend": "Подписанные ссылки действий",
  "remoteControl.links.intro":
    "Уведомления о паузе прогона содержат подписанные кнопки «Одобрить / Отклонить» или «Продолжить / Отменить». Каждая открывает страницу подтверждения; ничего не происходит, пока действие не подтверждено там.",
  "remoteControl.links.enabled.label": "Отвечать на подписанные ссылки",
  "remoteControl.links.enabled.help":
    "Включает страницы подтверждения. Выключено: уже отправленные ссылки отвечают 404, новые уведомления идут без кнопок.",
  "remoteControl.links.baseUrl.label": "Публичный адрес сервера",
  "remoteControl.links.baseUrl.help":
    "Адрес https://, по которому сервер доступен с телефона. Используется в кнопках, ссылках /cancel и ссылках на страницу прогона; без https кнопки не создаются.",
  "remoteControl.links.secret.label": "Секрет подписи ссылок",
  "remoteControl.links.secret.help":
    "HMAC-секрет, которым подписывается каждая ссылка (не короче 32 байт). «Сгенерировать» заменяет его — уже отправленные ссылки перестают работать; «Ротировать» сохраняет их действующими до истечения срока.",
  "remoteControl.links.rotate": "Ротировать",
  "remoteControl.links.rotated":
    "Секрет ротирован: новые ссылки подписаны новым секретом, уже отправленные работают до истечения срока.",
  "remoteControl.links.rotateFailed": "Ротация не удалась: {reason}",
  "remoteControl.links.ttl.label": "Срок действия ссылок, с",
  "remoteControl.links.ttl.help":
    "Сколько действуют ссылки «одобрить / отклонить / продолжить / отменить» в уведомлениях (60–604800, по умолчанию 3600).",

  "settings.autopilot.secretsTitle": "Секреты вебхуков и лимиты",
  "settings.autopilot.secretsHint":
    "Введите секрет, заданный в вебхуке GitHub или Linear, или сгенерируйте его здесь и вставьте туда. Хранится только на сервере; изменение действует со следующей доставки.",
  "settings.autopilot.githubSecret.label": "Секрет вебхука GitHub",
  "settings.autopilot.githubSecret.help":
    "Проверяет X-Hub-Signature-256 каждой доставки GitHub. Пусто — вебхук GitHub отвечает 503.",
  "settings.autopilot.linearSecret.label": "Секрет подписи вебхука Linear",
  "settings.autopilot.linearSecret.help":
    "Проверяет Linear-Signature каждой доставки Linear. Пусто — вебхук Linear отвечает 503.",
  "settings.autopilot.tolerance.label": "Допуск часов Linear, с",
  "settings.autopilot.tolerance.help":
    "Доставка Linear с отметкой времени дальше этого от часов сервера отклоняется как повтор (1–3600, по умолчанию 60).",
  "settings.autopilot.eventLogLimit.label": "Хранить событий",
  "settings.autopilot.eventLogLimit.help":
    "Сколько событий автозапуска хранит журнал ниже; старые удаляются (по умолчанию 200).",
  "settings.autopilot.ledgerLimit.label": "Запоминать ID доставок",
  "settings.autopilot.ledgerLimit.help":
    "Сколько ID доставок вебхуков запоминается, чтобы игнорировать повторы (по умолчанию 2000).",
};
