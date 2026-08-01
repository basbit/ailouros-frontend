import type { Messages } from "./types";

export const featureFlagsReasoningEfficiencyEn: Messages = {
  "featureFlags.field.swarm_reasoning_prm.label": "Process reward model",
  "featureFlags.field.swarm_reasoning_prm.hint":
    "Per-step LLM judge that scores reasoning quality.",
  "featureFlags.field.swarm_reasoning_verifier.label": "Verifier model",
  "featureFlags.field.swarm_reasoning_verifier.hint":
    "Second-opinion pass that may revise or abstain.",
  "featureFlags.field.swarm_reflexion.label": "Reflexion loop",
  "featureFlags.field.swarm_reflexion.hint":
    "Reflexion — the agent self-critiques and revises its own answer before finalizing (extra LLM pass).",
  "featureFlags.field.swarm_reasoning_self_consistency_samples.label":
    "Self-consistency samples",
  "featureFlags.field.swarm_reasoning_self_consistency_samples.hint":
    "Samples for self-consistency majority voting (1 = off).",
  "featureFlags.field.swarm_reasoning_verifier_model.label": "Verifier model",
  "featureFlags.field.swarm_reasoning_verifier_model.hint":
    "Model id for the second-opinion verifier pass.",
  "featureFlags.field.swarm_reasoning_prm_model.label": "PRM model",
  "featureFlags.field.swarm_reasoning_prm_model.hint":
    "Model id for the process-reward-model per-step scoring.",
  "featureFlags.field.swarm_research_adversarial.label":
    "Adversarial research hardening",
  "featureFlags.field.swarm_research_adversarial.hint":
    "Attack each research claim against its source before letting it into the context.",
  "featureFlags.field.swarm_prompt_cache.label": "Prompt cache",
  "featureFlags.field.swarm_prompt_cache.hint":
    "Reuse provider prompt-cache markers across requests.",
  "featureFlags.field.swarm_delta_prompting.label": "Delta prompting",
  "featureFlags.field.swarm_delta_prompting.hint":
    "Send only the diff against the previous prompt when supported.",
  "featureFlags.field.swarm_output_compression.label": "Output compression",
  "featureFlags.field.swarm_output_compression.hint":
    "Compress agent outputs before storing them in memory.",
  "featureFlags.field.swarm_efficiency_semantic_cache.label": "Semantic LLM cache",
  "featureFlags.field.swarm_efficiency_semantic_cache.hint":
    "Cache LLM responses keyed by embedding similarity.",
  "featureFlags.field.swarm_efficiency_batch_inference.label": "Batch inference",
  "featureFlags.field.swarm_efficiency_batch_inference.hint":
    "Group concurrent LLM calls into a single batch where supported.",
  "featureFlags.field.swarm_planning_cache.label": "Planning & research cache",
  "featureFlags.field.swarm_planning_cache.hint":
    "Reuse planning and research output across runs; turn off to force every run to redo it.",
};

export const featureFlagsReasoningEfficiencyRu: Messages = {
  "featureFlags.field.swarm_reasoning_prm.label": "Process reward model",
  "featureFlags.field.swarm_reasoning_prm.hint":
    "Пошаговый LLM-судья качества рассуждений.",
  "featureFlags.field.swarm_reasoning_verifier.label": "Verifier model",
  "featureFlags.field.swarm_reasoning_verifier.hint":
    "Second-opinion проход с возможной правкой или абстейном.",
  "featureFlags.field.swarm_reflexion.label": "Reflexion loop",
  "featureFlags.field.swarm_reflexion.hint":
    "Reflexion — агент сам критикует и правит свой ответ перед финализацией (доп. LLM-проход).",
  "featureFlags.field.swarm_reasoning_self_consistency_samples.label":
    "Сэмплы self-consistency",
  "featureFlags.field.swarm_reasoning_self_consistency_samples.hint":
    "Сколько сэмплов для голосования self-consistency (1 = выключено).",
  "featureFlags.field.swarm_reasoning_verifier_model.label": "Verifier model",
  "featureFlags.field.swarm_reasoning_verifier_model.hint":
    "Идентификатор модели для second-opinion verifier-прохода.",
  "featureFlags.field.swarm_reasoning_prm_model.label": "PRM model",
  "featureFlags.field.swarm_reasoning_prm_model.hint":
    "Идентификатор модели для пошагового скоринга process-reward-model.",
  "featureFlags.field.swarm_research_adversarial.label":
    "Состязательная проверка research",
  "featureFlags.field.swarm_research_adversarial.hint":
    "Атаковать каждое research-утверждение против его источника, прежде чем пустить его в контекст.",
  "featureFlags.field.swarm_prompt_cache.label": "Prompt cache",
  "featureFlags.field.swarm_prompt_cache.hint":
    "Переиспользовать prompt-cache маркеры провайдера между запросами.",
  "featureFlags.field.swarm_delta_prompting.label": "Delta prompting",
  "featureFlags.field.swarm_delta_prompting.hint":
    "Отправлять только diff предыдущего промпта, если провайдер поддерживает.",
  "featureFlags.field.swarm_output_compression.label": "Сжатие выводов",
  "featureFlags.field.swarm_output_compression.hint":
    "Сжимать выводы агентов перед сохранением в память.",
  "featureFlags.field.swarm_efficiency_semantic_cache.label": "Семантический LLM-кэш",
  "featureFlags.field.swarm_efficiency_semantic_cache.hint":
    "Кэш LLM-ответов по embedding-сходству.",
  "featureFlags.field.swarm_efficiency_batch_inference.label": "Batch inference",
  "featureFlags.field.swarm_efficiency_batch_inference.hint":
    "Группировать одновременные LLM-вызовы в батч, если поддерживается.",
  "featureFlags.field.swarm_planning_cache.label": "Кэш планирования и research",
  "featureFlags.field.swarm_planning_cache.hint":
    "Переиспользовать результаты планирования и research между прогонами; выключите, чтобы каждый прогон пересчитывал их заново.",
};
