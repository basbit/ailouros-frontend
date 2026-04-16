<template>
  <div v-if="visible" class="human-gate">
    <div class="human-gate-title">&#9646; {{ title }}</div>

    <!-- Diff viewer -->
    <DiffViewer
      v-if="diffData"
      :diff-text="diffData.diffText"
      :files="diffData.files"
      :stats="diffData.stats"
      :source="diffData.source"
      :task-id="props.taskId"
    />

    <!-- Inline file editor (H-11) — appears only when diff has file_list -->
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

    <!-- Fetch error -->
    <div v-if="fetchError" class="clarify-error">{{ fetchError }}</div>

    <!-- Clarify mode: chips -->
    <div v-if="clarifyQuestions.length" class="clarify-form">
      <div v-for="q in clarifyQuestions" :key="q.index" class="clarify-q">
        <p class="clarify-q__text">{{ q.index }}. {{ q.text }}</p>
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
      </div>
      <button
        type="button"
        class="btn-primary"
        style="margin-top: 8px"
        :disabled="!allAnswered"
        @click="submitAnswers"
      >
        {{ t("humanGate.submit") }}
      </button>
    </div>

    <!-- Fallback: textarea -->
    <div v-else>
      <textarea
        :value="feedback"
        style="height: 100px; margin-top: 6px"
        :placeholder="t('humanGate.feedbackPlaceholder')"
        @input="emit('update:feedback', ($event.target as HTMLTextAreaElement).value)"
      />
      <button
        type="button"
        class="btn-primary"
        style="margin-top: 8px"
        @click="emit('submit')"
      >
        {{ t("humanGate.submit") }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import DiffViewer from "@/features/diff-viewer/DiffViewer.vue";

interface ClarifyQuestion {
  index: number;
  text: string;
  options: string[];
}

const props = defineProps<{
  visible: boolean;
  title: string;
  feedback: string;
  taskId?: string;
}>();

const emit = defineEmits<{
  submit: [];
  "update:feedback": [val: string];
}>();
const { t } = useI18n();

const clarifyQuestions = ref<ClarifyQuestion[]>([]);
const answers = ref<Record<number, string>>({});
const customMode = ref<Record<number, boolean>>({});
const customAnswers = ref<Record<number, string>>({});
const comments = ref<Record<number, string>>({});
const fetchError = ref<string | null>(null);

// diff viewer state
const diffData = ref<{
  diffText: string;
  files: string[];
  stats: { added: number; removed: number; files: number };
  source: "git" | "file_list" | "none";
} | null>(null);

// H-11 inline file editor state
const selectedEditPath = ref<string>("");
const editContent = ref<string>("");
const editOriginal = ref<string>("");
const editLoading = ref<boolean>(false);
const editSaving = ref<boolean>(false);
const editError = ref<string | null>(null);

async function loadEditFile(path: string): Promise<void> {
  if (!props.taskId || !path) return;
  editLoading.value = true;
  editError.value = null;
  editContent.value = "";
  editOriginal.value = "";
  try {
    const r = await fetch(
      apiUrl(
        `/v1/tasks/${props.taskId}/workspace-file?path=${encodeURIComponent(path)}`,
      ),
    );
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { detail?: string };
      editError.value =
        body.detail ?? `${t("humanGate.editLoadError")} (HTTP ${r.status})`;
      return;
    }
    const data = (await r.json()) as { path: string; content: string };
    editContent.value = data.content ?? "";
    editOriginal.value = data.content ?? "";
  } catch (e) {
    editError.value = e instanceof Error ? e.message : String(e);
  } finally {
    editLoading.value = false;
  }
}

function onEditPathChange(): void {
  void loadEditFile(selectedEditPath.value);
}

async function saveEditedFile(): Promise<void> {
  if (!props.taskId || !selectedEditPath.value) return;
  editSaving.value = true;
  editError.value = null;
  try {
    const r = await fetch(apiUrl(`/v1/tasks/${props.taskId}/workspace-file`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: selectedEditPath.value,
        content: editContent.value,
      }),
    });
    if (!r.ok) {
      const body = (await r.json().catch(() => ({}))) as { detail?: string };
      editError.value =
        body.detail ?? `${t("humanGate.editSaveError")} (HTTP ${r.status})`;
      return;
    }
    editOriginal.value = editContent.value;
    // Refetch diff so the viewer reflects manual edits
    void fetchWorkspaceDiff();
  } catch (e) {
    editError.value = e instanceof Error ? e.message : String(e);
  } finally {
    editSaving.value = false;
  }
}

function resetEditState(): void {
  selectedEditPath.value = "";
  editContent.value = "";
  editOriginal.value = "";
  editError.value = null;
  editLoading.value = false;
  editSaving.value = false;
}

async function fetchWorkspaceDiff(): Promise<void> {
  if (!props.taskId) return;
  try {
    const r = await fetch(apiUrl(`/v1/tasks/${props.taskId}/workspace-diff`));
    if (!r.ok) return;
    const data = await r.json();
    // Only show diff if there are actually changed files
    if (Array.isArray(data.files_changed) && data.files_changed.length > 0) {
      diffData.value = {
        diffText: data.diff_text ?? "",
        files: data.files_changed,
        stats: data.stats ?? {
          added: 0,
          removed: 0,
          files: (data.files_changed as string[]).length,
        },
        source: data.source ?? "file_list",
      };
    }
  } catch (e) {
    // Diff viewer is a display enhancement; log but do not block the gate UI
    console.warn("[HumanGate] workspace-diff fetch failed:", e);
  }
}

async function fetchClarifyQuestions(): Promise<void> {
  if (!props.taskId) return;
  fetchError.value = null;
  try {
    const r = await fetch(apiUrl(`/v1/tasks/${props.taskId}/clarify-questions`));
    if (!r.ok) {
      fetchError.value = `${t("humanGate.fetchError")} (HTTP ${r.status})`;
      return;
    }
    const data = await r.json();
    const qs: ClarifyQuestion[] = Array.isArray(data.questions) ? data.questions : [];
    // Only use chip mode if at least one question has options
    clarifyQuestions.value = qs.filter((q) => q.options && q.options.length > 0);
  } catch (e) {
    fetchError.value = e instanceof Error ? e.message : String(e);
    clarifyQuestions.value = [];
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      answers.value = {};
      customMode.value = {};
      customAnswers.value = {};
      comments.value = {};
      clarifyQuestions.value = [];
      fetchError.value = null;
      resetEditState();
      void fetchClarifyQuestions();
      void fetchWorkspaceDiff();
    } else {
      diffData.value = null;
      resetEditState();
    }
  },
  { immediate: true },
);

function selectAnswer(idx: number, opt: string): void {
  answers.value[idx] = opt;
  customMode.value[idx] = false;
}

function enableCustom(idx: number): void {
  customMode.value[idx] = true;
  answers.value[idx] = "";
}

const allAnswered = computed(() =>
  clarifyQuestions.value.every((q) => {
    if (customMode.value[q.index])
      return (customAnswers.value[q.index] ?? "").trim() !== "";
    return (answers.value[q.index] ?? "") !== "";
  }),
);

function submitAnswers(): void {
  const lines = clarifyQuestions.value.map((q) => {
    const mainAns = customMode.value[q.index]
      ? (customAnswers.value[q.index] ?? "").trim()
      : (answers.value[q.index] ?? "").trim();
    const comment = (comments.value[q.index] ?? "").trim();
    if (comment) {
      return `Q${q.index}: ${mainAns} | ${t("humanGate.commentLabel")}: ${comment}`;
    }
    return `Q${q.index}: ${mainAns}`;
  });
  emit("update:feedback", lines.join("\n"));
  emit("submit");
}
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
</style>
