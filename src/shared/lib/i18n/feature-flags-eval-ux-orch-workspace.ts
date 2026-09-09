import type { Messages } from "./types";

export const featureFlagsEvalUxOrchWorkspaceEn: Messages = {
  "featureFlags.field.swarm_evaluation_ragas.label": "Ragas metrics",
  "featureFlags.field.swarm_evaluation_ragas.hint":
    "Compute faithfulness, answer relevancy, context precision and recall.",
  "featureFlags.field.swarm_evaluation_entailment.label": "NLI entailment check",
  "featureFlags.field.swarm_evaluation_entailment.hint":
    "Verify the final answer is entailed by the retrieved evidence.",
  "featureFlags.field.swarm_otel_enabled.label": "OpenTelemetry export",
  "featureFlags.field.swarm_otel_enabled.hint":
    "Emit span data via the configured OTel exporter.",
  "featureFlags.field.swarm_telemetry_exporter.label": "Telemetry exporter",
  "featureFlags.field.swarm_telemetry_exporter.hint":
    "Where traces go when OpenTelemetry export above is on.",
  "featureFlags.field.swarm_telemetry_exporter.option.default": "Server default (noop)",
  "featureFlags.field.swarm_telemetry_exporter.option.noop": "noop (discard)",
  "featureFlags.field.swarm_telemetry_exporter.option.console": "console (stdout)",
  "featureFlags.field.swarm_telemetry_exporter.option.otel": "otel (OTLP endpoint)",
  "featureFlags.field.swarm_sandbox_default_profile.label": "Sandbox profile",
  "featureFlags.field.swarm_sandbox_default_profile.hint":
    "Default sandbox profile id for code execution.",
  "featureFlags.field.swarm_sandbox_default_profile.option.empty": "Default (none)",
  "featureFlags.field.swarm_sandbox_default_profile.option.subprocess":
    "subprocess (host)",
  "featureFlags.field.swarm_sandbox_default_profile.option.docker": "docker container",
  "featureFlags.field.swarm_ux_streaming_partial_rag.label": "Streaming partial RAG",
  "featureFlags.field.swarm_ux_streaming_partial_rag.hint":
    "Emit a retrieval_done SSE event so the UI can render evidence early.",
  "featureFlags.field.swarm_ux_inline_citations.label": "Inline citations",
  "featureFlags.field.swarm_ux_inline_citations.hint":
    "Render [chunk_id:X] markers as clickable citations.",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.label": "Skill dispatcher",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.hint":
    "Classifier mode for the /dispatch slash command and auto-inject (off disables both; heuristic = rule-based; llm = model-based).",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.off": "off",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.heuristic":
    "heuristic (rule-based)",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.llm":
    "llm (model-based)",
  "featureFlags.field.swarm_orchestration_skill_dispatcher_auto.label":
    "Auto-inject skills into pipeline",
  "featureFlags.field.swarm_orchestration_skill_dispatcher_auto.hint":
    "When enabled, the skill dispatcher automatically assigns a skill to all pipeline roles based on the task text. Manual skill_ids on a role always take priority. Requires skill dispatcher mode != off.",
  "featureFlags.field.swarm_orchestration_quick_fix.label": "Quick-fix fast path",
  "featureFlags.field.swarm_orchestration_quick_fix.hint":
    "For verified single-file low-LOC changes, skip the post-plan review and human-approval steps — Dev, Verification and QA still run. Budget: SWARM_ORCHESTRATION_QUICK_FIX_MAX_LOC.",
  "featureFlags.field.swarm_orchestration_phase_verification_required.label":
    "Phase verification gate",
  "featureFlags.field.swarm_orchestration_phase_verification_required.hint":
    "Pause the run on every phase change and wait for a human decision in the Phase gates card (Run → Artifacts). Approve to continue; request changes to stop the run; auto-times-out after SWARM_ORCHESTRATION_PHASE_GATE_TTL_SECONDS.",
  "featureFlags.field.swarm_gate_audit_persist.label": "Persist gate decisions",
  "featureFlags.field.swarm_gate_audit_persist.hint":
    "Append every human-gate decision to an audit ledger on disk, instead of keeping it in memory only.",
  "featureFlags.field.swarm_dev_qa_task_count.label": "Dev/QA subtask count target",
  "featureFlags.field.swarm_dev_qa_task_count.hint":
    "Target number of subtasks for Dev Lead decomposition. Empty / auto lets Dev Lead decide dynamically based on scope.",
  "featureFlags.field.swarm_max_parallel_tasks.label": "Max parallel Dev tasks",
  "featureFlags.field.swarm_max_parallel_tasks.hint":
    "Maximum number of Dev subtasks executed in parallel concurrently (default 4).",
  "featureFlags.field.swarm_force_sequential.label": "Force sequential subtasks",
  "featureFlags.field.swarm_force_sequential.hint":
    "Run all Dev subtasks one after another in sequence instead of in parallel.",
  "featureFlags.field.swarm_parallel_safe_auto.label": "Parallel PLAN stages",
  "featureFlags.field.swarm_parallel_safe_auto.hint":
    "Automatically run independent planning steps (pm, ba, design, documentation, ...) in parallel stages. Steps that depend on an earlier step (ba depends on pm) always run after it.",
  "featureFlags.field.swarm_engine.label": "Pipeline engine",
  "featureFlags.field.swarm_engine.hint":
    "Execution engine for pipeline runs: linear (sequential runner, default) or graph (LangGraph step nodes with durable human-gate interrupts).",
  "featureFlags.field.swarm_engine.option.linear": "linear (sequential runner)",
  "featureFlags.field.swarm_engine.option.graph": "graph (LangGraph step nodes)",
  "featureFlags.field.swarm_tracer_bullet_enabled.label": "Tracer bullet phase",
  "featureFlags.field.swarm_tracer_bullet_enabled.hint":
    "Run the core cross-layer tracer story first alone to establish the foundation before running remaining stories in parallel.",
  "featureFlags.field.swarm_tracer_revision_gate.label": "Tracer revision gate",
  "featureFlags.field.swarm_tracer_revision_gate.hint":
    "Pause for a human to review the epic plan after the tracer story runs, before the remaining stories run.",
  "featureFlags.field.swarm_require_dev_writes.label":
    "Require dev step to write files",
  "featureFlags.field.swarm_require_dev_writes.hint":
    "Protection, on by default: fail a run whose dev step produced zero workspace writes. Uncheck to tolerate zero-write runs (legacy, relaxed mode).",
  "featureFlags.field.swarm_require_trusted_gates_pass.label":
    "Require trusted gates to pass",
  "featureFlags.field.swarm_require_trusted_gates_pass.hint":
    "Protection, on by default: fail a run whose trusted verification gates did not pass. Uncheck to only warn instead of failing the run (legacy, relaxed mode).",
  "featureFlags.field.swarm_workspace_snapshots.label": "Workspace snapshots",
  "featureFlags.field.swarm_workspace_snapshots.hint":
    "Take a workspace snapshot before applying writes; enables rollback.",
  "featureFlags.field.swarm_allow_workspace_write.label": "Allow workspace write",
  "featureFlags.field.swarm_allow_workspace_write.hint":
    "Master switch for write tools; per-task flag still has to be set.",
  "featureFlags.field.swarm_allow_command_exec.label": "Allow shell commands",
  "featureFlags.field.swarm_allow_command_exec.hint":
    "Master switch for <swarm_shell> execution (SWARM_ALLOW_COMMAND_EXEC); separate from file writes.",
  "featureFlags.field.swarm_exec_backend.label": "Command execution backend",
  "featureFlags.field.swarm_exec_backend.hint":
    "Where agent shell commands actually run. Empty uses the server default.",
  "featureFlags.field.swarm_exec_backend.option.default": "Server default (host)",
  "featureFlags.field.swarm_exec_backend.option.host":
    "host (runs directly on this machine)",
  "featureFlags.field.swarm_exec_backend.option.docker": "docker (isolated container)",
  "featureFlags.field.swarm_exec_backend.option.container":
    "container (isolated runtime)",
  "featureFlags.field.swarm_shell_allowlist.label": "Shell command allowlist",
  "featureFlags.field.swarm_shell_allowlist.hint":
    "Comma-separated executable names agents may run in <swarm_shell>. Leave empty to use the server default list shown below (pwd, ls, find, cat, head, tail, wc, file, stat, echo, which, env, npm, npx, yarn, pnpm, corepack, bun, node, pip, pip3, python, python3, uv, make, cargo, rustc, go, composer, php, dotnet, gradle, mvn, pytest, eslint, prettier, tsc, jest, vitest, ruff, flake8).",
  "featureFlags.field.swarm_goal_scheduler_enabled.label": "Goal scheduler",
  "featureFlags.field.swarm_goal_scheduler_enabled.hint":
    "Run long-running goals (cron-style) in the background.",
  "featureFlags.field.swarm_dev_shell_use_sandbox_resolver.label":
    "Dev shell via sandbox resolver",
  "featureFlags.field.swarm_dev_shell_use_sandbox_resolver.hint":
    "Run dev shell commands inside the sandbox profile instead of the host path.",
  "featureFlags.field.swarm_block_unjustified_full_rewrite_before_apply.label":
    "Block unjustified full-file rewrites",
  "featureFlags.field.swarm_block_unjustified_full_rewrite_before_apply.hint":
    "Block a full-file overwrite before it is applied when the agent gave no justification for it.",
  "featureFlags.field.swarm_computer_control_enabled.label": "Computer control tools",
  "featureFlags.field.swarm_computer_control_enabled.hint":
    'Give agents interactive browser tools (navigate, click, type, screenshot, accessibility tree) and supervised background processes. Starting a process additionally requires "Allow shell commands" and passes the shell allowlist.',
  "featureFlags.field.swarm_chrome_cdp_url.label": "Attach to running Chrome",
  "featureFlags.field.swarm_chrome_cdp_url.hint":
    "Drive a Chrome you already run with remote debugging (start it with --remote-debugging-port=9222) instead of a managed headless browser. Empty = managed headless Chromium.",
  "featureFlags.field.swarm_visual_baselines_enabled.label":
    "Visual baseline comparison",
  "featureFlags.field.swarm_visual_baselines_enabled.hint":
    "Compare every visual-probe screenshot against the stored baseline; drift becomes a P1 visual-regression defect.",
  "featureFlags.field.swarm_visual_baselines_update.label":
    "Overwrite visual baselines",
  "featureFlags.field.swarm_visual_baselines_update.hint":
    "Replace stored baselines with this run's screenshots instead of comparing. Turn on once after an intentional redesign, then turn it back off.",
};

export const featureFlagsEvalUxOrchWorkspaceRu: Messages = {
  "featureFlags.field.swarm_evaluation_ragas.label": "Ragas-метрики",
  "featureFlags.field.swarm_evaluation_ragas.hint":
    "Считать faithfulness, answer relevancy, context precision/recall.",
  "featureFlags.field.swarm_evaluation_entailment.label": "NLI-entailment проверка",
  "featureFlags.field.swarm_evaluation_entailment.hint":
    "Проверять, что финальный ответ обоснован retrieved evidence.",
  "featureFlags.field.swarm_otel_enabled.label": "OpenTelemetry-экспорт",
  "featureFlags.field.swarm_otel_enabled.hint":
    "Эмитить span data через настроенный OTel-экспортёр.",
  "featureFlags.field.swarm_telemetry_exporter.label": "Экспортёр телеметрии",
  "featureFlags.field.swarm_telemetry_exporter.hint":
    "Куда идут trace-данные, когда включён OpenTelemetry-экспорт выше.",
  "featureFlags.field.swarm_telemetry_exporter.option.default":
    "Значение сервера (noop)",
  "featureFlags.field.swarm_telemetry_exporter.option.noop": "noop (отбрасывать)",
  "featureFlags.field.swarm_telemetry_exporter.option.console": "console (stdout)",
  "featureFlags.field.swarm_telemetry_exporter.option.otel": "otel (OTLP endpoint)",
  "featureFlags.field.swarm_sandbox_default_profile.label": "Sandbox-профиль",
  "featureFlags.field.swarm_sandbox_default_profile.hint":
    "Профиль sandbox по умолчанию для исполнения кода.",
  "featureFlags.field.swarm_sandbox_default_profile.option.empty": "По умолчанию (нет)",
  "featureFlags.field.swarm_sandbox_default_profile.option.subprocess":
    "subprocess (хост)",
  "featureFlags.field.swarm_sandbox_default_profile.option.docker": "docker-контейнер",
  "featureFlags.field.swarm_ux_streaming_partial_rag.label": "Потоковый partial-RAG",
  "featureFlags.field.swarm_ux_streaming_partial_rag.hint":
    "Эмитить retrieval_done SSE-событие, чтобы UI показал evidence раньше.",
  "featureFlags.field.swarm_ux_inline_citations.label": "Инлайн-цитаты",
  "featureFlags.field.swarm_ux_inline_citations.hint":
    "Рендерить маркеры [chunk_id:X] как кликабельные цитаты.",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.label": "Skill dispatcher",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.hint":
    "Режим классификатора для /dispatch и авто-инжекции (off отключает оба; heuristic — по правилам; llm — модель).",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.off": "выключено",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.heuristic":
    "эвристика (правила)",
  "featureFlags.field.swarm_orchestration_skill_dispatcher.option.llm": "llm (модель)",
  "featureFlags.field.swarm_orchestration_skill_dispatcher_auto.label":
    "Авто-инжекция скиллов в пайплайн",
  "featureFlags.field.swarm_orchestration_skill_dispatcher_auto.hint":
    "При включении диспетчер автоматически назначает скилл всем ролям пайплайна по тексту задачи. Ручные skill_ids роли всегда в приоритете. Требует режима диспетчера != off.",
  "featureFlags.field.swarm_orchestration_quick_fix.label": "Quick-fix fast path",
  "featureFlags.field.swarm_orchestration_quick_fix.hint":
    "Для проверенных одно-файловых правок с малым LOC пропускает шаги ревью и ручного подтверждения после планирования — Dev, верификация и QA всё равно выполняются. Бюджет: SWARM_ORCHESTRATION_QUICK_FIX_MAX_LOC.",
  "featureFlags.field.swarm_orchestration_phase_verification_required.label":
    "Гейт проверки фаз",
  "featureFlags.field.swarm_orchestration_phase_verification_required.hint":
    "Останавливает прогон при каждой смене фазы и ждёт решения человека в карточке «Гейты фаз» (Run → Артефакты). Одобрить — продолжить; запросить изменения — остановить прогон; авто-таймаут через SWARM_ORCHESTRATION_PHASE_GATE_TTL_SECONDS.",
  "featureFlags.field.swarm_gate_audit_persist.label": "Сохранять решения gate",
  "featureFlags.field.swarm_gate_audit_persist.hint":
    "Дописывать каждое решение human-gate в журнал аудита на диске, а не хранить только в памяти.",
  "featureFlags.field.swarm_dev_qa_task_count.label": "Целевое число подзадач Dev/QA",
  "featureFlags.field.swarm_dev_qa_task_count.hint":
    "Желаемое количество подзадач при декомпозиции Dev Lead. Пусто / авто позволяет Dev Lead определять число динамически по масштабу.",
  "featureFlags.field.swarm_max_parallel_tasks.label":
    "Максимум параллельных задач Dev",
  "featureFlags.field.swarm_max_parallel_tasks.hint":
    "Максимальное количество параллельно выполняемых подзадач Dev (по умолчанию 4).",
  "featureFlags.field.swarm_force_sequential.label":
    "Принудительно последовательные подзадачи",
  "featureFlags.field.swarm_force_sequential.hint":
    "Выполнять все подзадачи Dev по очереди одна за другой вместо параллельного запуска.",
  "featureFlags.field.swarm_parallel_safe_auto.label": "Параллельные PLAN-стадии",
  "featureFlags.field.swarm_parallel_safe_auto.hint":
    "Автоматически выполнять независимые шаги планирования (pm, ba, design, documentation, ...) параллельными стадиями. Шаги, зависящие от предыдущего (ba зависит от pm), всегда выполняются после него.",
  "featureFlags.field.swarm_engine.label": "Движок пайплайна",
  "featureFlags.field.swarm_engine.hint":
    "Движок выполнения пайплайнов: linear (последовательный runner, по умолчанию) или graph (LangGraph step-ноды с durable human-gate interrupt'ами).",
  "featureFlags.field.swarm_engine.option.linear": "linear (последовательный runner)",
  "featureFlags.field.swarm_engine.option.graph": "graph (LangGraph step-ноды)",
  "featureFlags.field.swarm_tracer_bullet_enabled.label": "Фаза Tracer Bullet",
  "featureFlags.field.swarm_tracer_bullet_enabled.hint":
    "Сначала запускать базовую сквозную tracer-историю изолированно для создания фундамента, а затем выполнять остальные истории параллельно.",
  "featureFlags.field.swarm_tracer_revision_gate.label": "Gate ревизии tracer",
  "featureFlags.field.swarm_tracer_revision_gate.hint":
    "Останавливаться для проверки человеком epic-плана после tracer-истории, перед запуском остальных историй.",
  "featureFlags.field.swarm_require_dev_writes.label":
    "Требовать записи файлов на dev-шаге",
  "featureFlags.field.swarm_require_dev_writes.hint":
    "Защита, включена по умолчанию: прерывать прогон, если dev-шаг не сделал ни одной записи в workspace. Снимите галочку, чтобы допускать прогоны без записей (устаревший, смягчённый режим).",
  "featureFlags.field.swarm_require_trusted_gates_pass.label":
    "Требовать прохождения доверенных gate-проверок",
  "featureFlags.field.swarm_require_trusted_gates_pass.hint":
    "Защита, включена по умолчанию: прерывать прогон, если доверенные gate-проверки не прошли. Снимите галочку, чтобы только предупреждать вместо прерывания прогона (устаревший, смягчённый режим).",
  "featureFlags.field.swarm_workspace_snapshots.label": "Workspace-снимки",
  "featureFlags.field.swarm_workspace_snapshots.hint":
    "Делать снимок workspace перед записью; позволяет откат.",
  "featureFlags.field.swarm_allow_workspace_write.label":
    "Разрешить запись в workspace",
  "featureFlags.field.swarm_allow_workspace_write.hint":
    "Главный переключатель write-инструментов; per-task флаг тоже нужен.",
  "featureFlags.field.swarm_allow_command_exec.label": "Разрешить shell-команды",
  "featureFlags.field.swarm_allow_command_exec.hint":
    "Главный переключатель выполнения <swarm_shell> (SWARM_ALLOW_COMMAND_EXEC); отдельно от записи файлов.",
  "featureFlags.field.swarm_exec_backend.label": "Бэкенд выполнения команд",
  "featureFlags.field.swarm_exec_backend.hint":
    "Где реально выполняются shell-команды агентов. Пусто = значение сервера по умолчанию.",
  "featureFlags.field.swarm_exec_backend.option.default": "Значение сервера (host)",
  "featureFlags.field.swarm_exec_backend.option.host":
    "host (выполняется прямо на этой машине)",
  "featureFlags.field.swarm_exec_backend.option.docker":
    "docker (изолированный контейнер)",
  "featureFlags.field.swarm_exec_backend.option.container":
    "container (изолированная среда выполнения)",
  "featureFlags.field.swarm_shell_allowlist.label": "Разрешённые shell-команды",
  "featureFlags.field.swarm_shell_allowlist.hint":
    "Список разрешённых исполняемых файлов через запятую для <swarm_shell>. Пусто = список сервера по умолчанию, показанный ниже (pwd, ls, find, cat, head, tail, wc, file, stat, echo, which, env, npm, npx, yarn, pnpm, corepack, bun, node, pip, pip3, python, python3, uv, make, cargo, rustc, go, composer, php, dotnet, gradle, mvn, pytest, eslint, prettier, tsc, jest, vitest, ruff, flake8).",
  "featureFlags.field.swarm_goal_scheduler_enabled.label": "Планировщик целей",
  "featureFlags.field.swarm_goal_scheduler_enabled.hint":
    "Запускать долгоживущие цели (cron-style) в фоне.",
  "featureFlags.field.swarm_dev_shell_use_sandbox_resolver.label":
    "Dev shell через sandbox resolver",
  "featureFlags.field.swarm_dev_shell_use_sandbox_resolver.hint":
    "Выполнять команды dev shell внутри sandbox-профиля вместо хостового пути.",
  "featureFlags.field.swarm_block_unjustified_full_rewrite_before_apply.label":
    "Блокировать необоснованный full-rewrite",
  "featureFlags.field.swarm_block_unjustified_full_rewrite_before_apply.hint":
    "Блокировать полную перезапись файла перед применением, если агент не дал для неё обоснования.",
  "featureFlags.field.swarm_computer_control_enabled.label":
    "Инструменты управления компьютером",
  "featureFlags.field.swarm_computer_control_enabled.hint":
    "Дать агентам интерактивные браузерные инструменты (навигация, клик, ввод, скриншот, дерево доступности) и фоновые процессы под супервизором. Запуск процесса дополнительно требует «Разрешить shell-команды» и проходит проверку allowlist.",
  "featureFlags.field.swarm_chrome_cdp_url.label": "Подключаться к запущенному Chrome",
  "featureFlags.field.swarm_chrome_cdp_url.hint":
    "Управлять уже запущенным Chrome с remote debugging (запустите его с --remote-debugging-port=9222) вместо управляемого headless-браузера. Пусто = управляемый headless Chromium.",
  "featureFlags.field.swarm_visual_baselines_enabled.label": "Сравнение с эталонами",
  "featureFlags.field.swarm_visual_baselines_enabled.hint":
    "Сравнивать каждый скриншот visual-probe с сохранённым эталоном; расхождение становится дефектом P1 visual-regression.",
  "featureFlags.field.swarm_visual_baselines_update.label": "Перезаписать эталоны",
  "featureFlags.field.swarm_visual_baselines_update.hint":
    "Заменить сохранённые эталоны скриншотами этого прогона вместо сравнения. Включите один раз после намеренного редизайна и выключите обратно.",
};
