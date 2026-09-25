import type { Messages } from "./types";

export const codegenFeedbackEn: Messages = {
  "codegenFeedback.verdict.accept": "Accept",
  "codegenFeedback.verdict.reject": "Reject",
  "codegenFeedback.verdict.edit": "I edited it",
  "codegenFeedback.reasonPlaceholder.reject":
    "What is wrong with this file? The dev agent reads this next time it touches it.",
  "codegenFeedback.reasonPlaceholder.edit":
    "What did you change and why? Your saved edit is attached when there is one.",
  "codegenFeedback.diffAttached": "Your saved edit to this file will be attached.",
  "codegenFeedback.noWorkspace":
    "Pick a workspace folder to record feedback: it is kept per project.",
  "codegenFeedback.submit": "Send feedback",
  "codegenFeedback.cancel": "Cancel",
  "codegenFeedback.sent": "Feedback on {file} recorded",
  "codegenFeedback.failed": "Could not record feedback: {error}",
  "codegenFeedback.done.accept": "Accepted",
  "codegenFeedback.done.reject": "Rejected",
  "codegenFeedback.done.edit": "Marked as edited",
};

export const codegenFeedbackRu: Messages = {
  "codegenFeedback.verdict.accept": "Принять",
  "codegenFeedback.verdict.reject": "Отклонить",
  "codegenFeedback.verdict.edit": "Я поправил",
  "codegenFeedback.reasonPlaceholder.reject":
    "Что не так с этим файлом? Dev-агент прочитает это, когда снова возьмётся за файл.",
  "codegenFeedback.reasonPlaceholder.edit":
    "Что вы изменили и почему? Сохранённая правка приложится, если она есть.",
  "codegenFeedback.diffAttached":
    "Ваша сохранённая правка этого файла будет приложена.",
  "codegenFeedback.noWorkspace":
    "Выберите папку проекта, чтобы оставить отзыв: отзывы хранятся по проектам.",
  "codegenFeedback.submit": "Отправить отзыв",
  "codegenFeedback.cancel": "Отмена",
  "codegenFeedback.sent": "Отзыв по {file} записан",
  "codegenFeedback.failed": "Не удалось записать отзыв: {error}",
  "codegenFeedback.done.accept": "Принято",
  "codegenFeedback.done.reject": "Отклонено",
  "codegenFeedback.done.edit": "Отмечено как поправленное",
};
