import { ref, computed, type Ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import type { ClarifyQuestion } from "./useHumanGateWorkspace";

export function useHumanGateActions(
  clarifyQuestions: Ref<ClarifyQuestion[]>,
  emitFeedback: (val: string) => void,
  emitSubmit: (feedback: string) => void,
) {
  const { t } = useI18n();

  const answers = ref<Record<number, string>>({});
  const customMode = ref<Record<number, boolean>>({});
  const customAnswers = ref<Record<number, string>>({});
  const comments = ref<Record<number, string>>({});

  function selectAnswer(idx: number, opt: string): void {
    answers.value[idx] = opt;
    customMode.value[idx] = false;
  }

  function enableCustom(idx: number): void {
    customMode.value[idx] = true;
    answers.value[idx] = "";
  }

  function resetClarifyAnswers(): void {
    answers.value = {};
    customMode.value = {};
    customAnswers.value = {};
    comments.value = {};
  }

  const allAnswered = computed(() =>
    clarifyQuestions.value.every((q) => {
      if (q.options.length === 0)
        return (customAnswers.value[q.index] ?? "").trim() !== "";
      if (customMode.value[q.index])
        return (customAnswers.value[q.index] ?? "").trim() !== "";
      return (answers.value[q.index] ?? "") !== "";
    }),
  );

  function submitAnswers(): void {
    const lines = clarifyQuestions.value.map((q) => {
      const mainAns =
        q.options.length === 0
          ? (customAnswers.value[q.index] ?? "").trim()
          : customMode.value[q.index]
            ? (customAnswers.value[q.index] ?? "").trim()
            : (answers.value[q.index] ?? "").trim();
      const comment = (comments.value[q.index] ?? "").trim();
      if (comment) {
        return `Q${q.index}: ${mainAns} | ${t("humanGate.commentLabel")}: ${comment}`;
      }
      return `Q${q.index}: ${mainAns}`;
    });
    const feedback = lines.join("\n");
    emitFeedback(feedback);
    emitSubmit(feedback);
  }

  return {
    answers,
    customMode,
    customAnswers,
    comments,
    selectAnswer,
    enableCustom,
    resetClarifyAnswers,
    allAnswered,
    submitAnswers,
  };
}
