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
  "featureFlags.field.swarm_ux_feedback_collection.label": "Feedback collection",
  "featureFlags.field.swarm_ux_feedback_collection.hint":
    "Show thumbs-up/down chips on agent answers and persist verdicts.",
  "featureFlags.field.swarm_ux_inline_citations.label": "Inline citations",
  "featureFlags.field.swarm_ux_inline_citations.hint":
    "Render [chunk_id:X] markers as clickable citations.",
  "featureFlags.field.swarm_ux_follow_up_suggestions_count.label":
    "Follow-up suggestions",
  "featureFlags.field.swarm_ux_follow_up_suggestions_count.hint":
    "How many follow-up question chips to render (0 disables the feature).",
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
  "featureFlags.field.swarm_workspace_snapshots.label": "Workspace snapshots",
  "featureFlags.field.swarm_workspace_snapshots.hint":
    "Take a workspace snapshot before applying writes; enables rollback.",
  "featureFlags.field.swarm_allow_workspace_write.label": "Allow workspace write",
  "featureFlags.field.swarm_allow_workspace_write.hint":
    "Master switch for write tools; per-task flag still has to be set.",
  "featureFlags.field.swarm_allow_command_exec.label": "Allow shell commands",
  "featureFlags.field.swarm_allow_command_exec.hint":
    "Master switch for <swarm_shell> execution (SWARM_ALLOW_COMMAND_EXEC); separate from file writes.",
  "featureFlags.field.swarm_goal_scheduler_enabled.label": "Goal scheduler",
  "featureFlags.field.swarm_goal_scheduler_enabled.hint":
    "Run long-running goals (cron-style) in the background.",
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
  "featureFlags.field.swarm_ux_feedback_collection.label": "Сбор обратной связи",
  "featureFlags.field.swarm_ux_feedback_collection.hint":
    "Показывать thumbs-up/down чипы на ответах и сохранять оценки.",
  "featureFlags.field.swarm_ux_inline_citations.label": "Инлайн-цитаты",
  "featureFlags.field.swarm_ux_inline_citations.hint":
    "Рендерить маркеры [chunk_id:X] как кликабельные цитаты.",
  "featureFlags.field.swarm_ux_follow_up_suggestions_count.label":
    "Follow-up-предложения",
  "featureFlags.field.swarm_ux_follow_up_suggestions_count.hint":
    "Сколько follow-up чипов рендерить (0 отключает фичу).",
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
  "featureFlags.field.swarm_goal_scheduler_enabled.label": "Планировщик целей",
  "featureFlags.field.swarm_goal_scheduler_enabled.hint":
    "Запускать долгоживущие цели (cron-style) в фоне.",
};
