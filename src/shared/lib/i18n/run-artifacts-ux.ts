import type { Messages } from "./types";

export const runArtifactsUxEn: Messages = {
  "inlineCitations.listAria": "Resolved citations",
  "inlineCitations.headline": "Citations",
  "inlineCitations.found": "found",
  "inlineCitations.missing": "missing",
  "inlineCitations.click": "Click to open in wiki",
  "feedbackThumbs.cardAria": "Run feedback",
  "feedbackThumbs.headline": "Was this run helpful?",
  "feedbackThumbs.hint":
    "Capture a thumbs-up/down or promote the run to a regression golden — pairs query + chunk_ids with your rationale.",
  "feedbackThumbs.queryLabel": "Query",
  "feedbackThumbs.queryPlaceholder": "The original question / prompt",
  "feedbackThumbs.optionalFields": "Optional context",
  "feedbackThumbs.rationaleLabel": "Rationale (used to seed required substrings)",
  "feedbackThumbs.rationalePlaceholder":
    "Why was this run good or bad? Keywords from your text get pulled into the golden.",
  "feedbackThumbs.chunkIdsLabel": "Chunk IDs (comma-separated)",
  "feedbackThumbs.chunkIdsPlaceholder": "wiki/auth#login, wiki/auth#logout",
  "feedbackThumbs.thumbsUp": "Thumbs up",
  "feedbackThumbs.thumbsDown": "Thumbs down",
  "feedbackThumbs.markAsGolden": "Mark as Golden",
  "feedbackThumbs.goldenNeedsChunks":
    "Add at least one chunk_id before promoting to a golden",
  "feedbackThumbs.promote": "Promote to golden",
  "feedbackThumbs.promoting": "Promoting…",
  "feedbackThumbs.promotedTo": "Appended to {path}",
  "feedbackThumbs.kindUp": "👍",
  "feedbackThumbs.kindDown": "👎",
  "feedbackThumbs.kindGolden": "⭐",
  "followUpChips.cardAria": "Suggested follow-up questions",
  "followUpChips.headline": "Try a follow-up",
  "followUpChips.hint":
    "Generate model-suggested next questions to deepen the conversation.",
  "followUpChips.placeholder": "The original query or topic",
  "followUpChips.generate": "Generate",
  "followUpChips.generating": "Generating…",
  "followUpChips.empty": "No suggestions returned for this query.",
  "followUpChips.disabled":
    "Follow-up suggestions are disabled — set SWARM_UX_FOLLOW_UP_SUGGESTIONS_COUNT and _MODEL to enable.",
};

export const runArtifactsUxRu: Messages = {
  "inlineCitations.listAria": "Найденные цитаты",
  "inlineCitations.headline": "Цитаты",
  "inlineCitations.found": "найдено",
  "inlineCitations.missing": "не найдено",
  "inlineCitations.click": "Открыть в вики",
  "feedbackThumbs.cardAria": "Фидбек о прогоне",
  "feedbackThumbs.headline": "Прогон был полезен?",
  "feedbackThumbs.hint":
    "Поставь палец вверх/вниз или продвинь прогон в regression-золотую базу — собирает связку запрос + chunk_ids + обоснование.",
  "feedbackThumbs.queryLabel": "Запрос",
  "feedbackThumbs.queryPlaceholder": "Исходный вопрос / промпт",
  "feedbackThumbs.optionalFields": "Дополнительный контекст",
  "feedbackThumbs.rationaleLabel":
    "Обоснование (станет источником required substrings)",
  "feedbackThumbs.rationalePlaceholder":
    "Почему прогон был хорош или плох? Ключевые слова из текста попадут в золотую запись.",
  "feedbackThumbs.chunkIdsLabel": "Chunk ID (через запятую)",
  "feedbackThumbs.chunkIdsPlaceholder": "wiki/auth#login, wiki/auth#logout",
  "feedbackThumbs.thumbsUp": "Палец вверх",
  "feedbackThumbs.thumbsDown": "Палец вниз",
  "feedbackThumbs.markAsGolden": "Сделать золотым",
  "feedbackThumbs.goldenNeedsChunks":
    "Добавь хотя бы один chunk_id, чтобы продвинуть в золотые",
  "feedbackThumbs.promote": "Продвинуть в золотые",
  "feedbackThumbs.promoting": "Продвигаю…",
  "feedbackThumbs.promotedTo": "Добавлено в {path}",
  "feedbackThumbs.kindUp": "👍",
  "feedbackThumbs.kindDown": "👎",
  "feedbackThumbs.kindGolden": "⭐",
  "followUpChips.cardAria": "Предлагаемые уточняющие вопросы",
  "followUpChips.headline": "Следующий вопрос",
  "followUpChips.hint":
    "Сгенерируй продолжение диалога, основанное на исходном запросе.",
  "followUpChips.placeholder": "Исходный вопрос или тема",
  "followUpChips.generate": "Сгенерировать",
  "followUpChips.generating": "Генерирую…",
  "followUpChips.empty": "Для этого запроса ничего не предложено.",
  "followUpChips.disabled":
    "Уточняющие вопросы отключены — задай SWARM_UX_FOLLOW_UP_SUGGESTIONS_COUNT и _MODEL.",
};
