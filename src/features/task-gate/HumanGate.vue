<template>
  <div v-if="visible" class="human-gate">
    <div class="human-gate-title">&#9646; {{ title }}</div>

    <DiffViewer
      v-if="diffData"
      :diff-text="diffData.diffText"
      :files="diffData.files"
      :stats="diffData.stats"
      :source="diffData.source"
      :task-id="props.taskId"
    />

    <div v-if="diffData && diffData.files.length > 0" class="file-editor">
      <div class="file-editor__header">
        <select
          v-model="selectedEditPath"
          class="file-editor__select"
          @change="onEditPathChange"
        >
          <option value="">{{ t("humanGate.editPickFile") }}</option>
          <option v-for="path in diffData.files" :key="path" :value="path">
            {{ path }}
          </option>
        </select>
        <button
          v-if="selectedEditPath"
          type="button"
          class="btn-primary file-editor__save"
          :disabled="editSaving || editLoading || editContent === editOriginal"
          @click="saveEditedFile"
        >
          {{ editSaving ? t("humanGate.editSaving") : t("humanGate.editSave") }}
        </button>
      </div>
      <div v-if="editLoading" class="file-editor__status">
        {{ t("humanGate.editLoading") }}
      </div>
      <div v-if="editError" class="clarify-error">{{ editError }}</div>
      <textarea
        v-if="selectedEditPath && !editLoading"
        v-model="editContent"
        class="file-editor__textarea"
        spellcheck="false"
      />
    </div>

    <div v-if="fetchError" class="clarify-error">{{ fetchError }}</div>

    <div v-if="clarifyQuestions.length" class="clarify-form">
      <div v-for="q in clarifyQuestions" :key="q.index" class="clarify-q">
        <p class="clarify-q__text">{{ q.index }}. {{ q.text }}</p>
        <template v-if="q.options.length > 0">
          <div class="clarify-q__options">
            <button
              v-for="opt in q.options.filter((o) => o !== 'Other')"
              :key="opt"
              type="button"
              class="chip"
              :class="{ selected: answers[q.index] === opt && !customMode[q.index] }"
              @click="selectAnswer(q.index, opt)"
            >
              {{ opt }}
            </button>
            <button
              type="button"
              class="chip chip--other"
              :class="{ selected: customMode[q.index] }"
              @click="enableCustom(q.index)"
            >
              {{ t("humanGate.other") }}
            </button>
          </div>
          <input
            v-if="customMode[q.index]"
            :value="customAnswers[q.index] ?? ''"
            class="clarify-q__custom-input"
            :placeholder="t('humanGate.answerPlaceholder')"
            @input="customAnswers[q.index] = ($event.target as HTMLInputElement).value"
          />
          <input
            v-if="answers[q.index] !== undefined || customMode[q.index]"
            :value="comments[q.index] ?? ''"
            class="clarify-q__custom-input"
            style="margin-top: 4px; font-size: 11px; opacity: 0.8"
            :placeholder="t('humanGate.commentPlaceholder')"
            @input="comments[q.index] = ($event.target as HTMLInputElement).value"
          />
        </template>
        <template v-else>
          <input
            :value="customAnswers[q.index] ?? ''"
            class="clarify-q__custom-input"
            :placeholder="t('humanGate.answerPlaceholder')"
            @input="customAnswers[q.index] = ($event.target as HTMLInputElement).value"
          />
        </template>
      </div>
      <button
        type="button"
        class="btn-primary"
        style="margin-top: 8px"
        :disabled="!allAnswered || submitting"
        @click="submitAnswers"
      >
        {{ submitting ? t("humanGate.submitting") : t("humanGate.submit") }}
      </button>
    </div>

    <div v-else>
      <textarea
        :value="feedback"
        style="height: 100px; margin-top: 6px"
        :placeholder="t('humanGate.feedbackPlaceholder')"
        :disabled="submitting"
        @input="emit('update:feedback', ($event.target as HTMLTextAreaElement).value)"
      />
      <button
        type="button"
        class="btn-primary"
        style="margin-top: 8px"
        :disabled="submitting"
        @click="emit('submit', feedback)"
      >
        {{ submitting ? t("humanGate.submitting") : t("humanGate.submit") }}
      </button>
    </div>

    <div v-if="submitting" class="human-gate-submitting">
      {{ t("humanGate.processingMessage") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { toRef, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import DiffViewer from "@/features/task-gate/DiffViewer.vue";
import { useHumanGateWorkspace } from "./useHumanGateWorkspace";
import { useHumanGateActions } from "./useHumanGateActions";

const props = defineProps<{
  visible: boolean;
  title: string;
  feedback: string;
  taskId?: string;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  submit: [feedback: string];
  "update:feedback": [val: string];
}>();
const { t } = useI18n();

const {
  clarifyQuestions,
  fetchError,
  diffData,
  selectedEditPath,
  editContent,
  editOriginal,
  editLoading,
  editSaving,
  editError,
  onEditPathChange,
  saveEditedFile,
  resetEditState,
  fetchWorkspaceDiff,
  fetchClarifyQuestions,
  clearDiff,
} = useHumanGateWorkspace(toRef(props, "taskId"));

const {
  answers,
  customMode,
  customAnswers,
  comments,
  selectAnswer,
  enableCustom,
  resetClarifyAnswers,
  allAnswered,
  submitAnswers,
} = useHumanGateActions(
  clarifyQuestions,
  (val) => emit("update:feedback", val),
  (feedback) => emit("submit", feedback),
);

function resetClarifyFormState(): void {
  resetClarifyAnswers();
  clarifyQuestions.value = [];
  fetchError.value = null;
  resetEditState();
}

watch(
  () => props.taskId,
  () => {
    resetClarifyFormState();
  },
);

watch(
  () => props.visible,
  (visibleNow) => {
    if (visibleNow) {
      void fetchClarifyQuestions();
      void fetchWorkspaceDiff();
    } else {
      clearDiff();
    }
  },
  { immediate: true },
);

watch(clarifyQuestions, (newQuestions, oldQuestions) => {
  const newKey = newQuestions.map((q) => `${q.index}|${q.text}`).join("\n");
  const oldKey = (oldQuestions ?? []).map((q) => `${q.index}|${q.text}`).join("\n");
  if (newKey !== oldKey && newQuestions.length > 0) {
    resetClarifyAnswers();
  }
});
</script>

<style scoped>
.clarify-error {
  margin-top: 6px;
  color: var(--error, #f03e3e);
  font-size: 12px;
}
.clarify-form {
  margin-top: 8px;
}
.clarify-q {
  margin-bottom: 12px;
}
.clarify-q__text {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--text1, #c8cfe8);
}
.clarify-q__options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}
.chip {
  padding: 4px 10px;
  border-radius: 14px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg2, #1e2230);
  color: var(--text2, #9dadd0);
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.chip:hover {
  background: var(--accent, #3b5bdb);
  color: #fff;
}
.chip.selected {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-color: var(--accent, #3b5bdb);
}
.chip--other {
  border-style: dashed;
}
.clarify-q__custom-input {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  font-size: 13px;
  background: var(--bg2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text1, #c8cfe8);
}
.file-editor {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  background: var(--bg2, #1e2230);
}
.file-editor__header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.file-editor__select {
  flex: 1;
  padding: 4px 8px;
  font-size: 12px;
  background: var(--bg1, #14171e);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text1, #c8cfe8);
}
.file-editor__save {
  padding: 4px 12px;
  font-size: 12px;
}
.file-editor__save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.file-editor__status {
  font-size: 12px;
  color: var(--text2, #9dadd0);
  margin-bottom: 6px;
}
.file-editor__textarea {
  width: 100%;
  box-sizing: border-box;
  min-height: 180px;
  padding: 6px 8px;
  font-size: 12px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  background: var(--bg1, #14171e);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text1, #c8cfe8);
  resize: vertical;
}
.human-gate-submitting {
  margin-top: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text2, #9dadd0);
  background: var(--bg2, #1e2230);
  border: 1px dashed var(--border, #2a2f3e);
  border-radius: 4px;
  font-style: italic;
}
</style>
