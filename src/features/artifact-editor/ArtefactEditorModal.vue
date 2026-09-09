<template>
  <div v-if="visible" class="artefact-editor-overlay" @keydown.esc="onClose">
    <div class="artefact-editor-modal" role="dialog" aria-modal="true">
      <header class="artefact-editor-header">
        <div class="artefact-editor-header__meta">
          <span class="artefact-editor-header__icon">&#128196;</span>
          <code class="artefact-editor-header__path">{{ filePath }}</code>
          <span v-if="isDirty" class="artefact-editor-header__dirty-badge">
            {{ t("artefactEditor.unsaved") }}
          </span>

          <nav class="artefact-editor-tabs" aria-label="Editor view mode">
            <button
              type="button"
              class="artefact-tab-btn"
              :class="{ 'artefact-tab-btn--active': activeTab === 'code' }"
              @click="activeTab = 'code'"
            >
              {{ t("artefactEditor.tabCode") }}
            </button>
            <button
              type="button"
              class="artefact-tab-btn"
              :class="{ 'artefact-tab-btn--active': activeTab === 'diff' }"
              @click="activeTab = 'diff'"
            >
              {{ t("artefactEditor.tabDiff") }}
              <span v-if="diffSummary.hasChanges" class="artefact-tab-badge">
                +{{ diffSummary.addedCount }} -{{ diffSummary.removedCount }}
              </span>
            </button>
          </nav>
        </div>

        <div class="artefact-editor-header__actions">
          <button
            type="button"
            class="artefact-btn artefact-btn--primary"
            :disabled="isSaving || !isDirty"
            @click="onSave"
          >
            {{ isSaving ? t("artefactEditor.saving") : t("artefactEditor.save") }}
          </button>

          <button
            v-if="taskId"
            type="button"
            class="artefact-btn artefact-btn--success"
            :disabled="isApproving"
            @click="onApproveWithEdits"
          >
            &#10003;
            {{
              isApproving
                ? t("artefactEditor.approving")
                : t("artefactEditor.approveWithEdits")
            }}
          </button>

          <button
            v-if="taskId"
            type="button"
            class="artefact-btn artefact-btn--warning"
            @click="toggleRejectBox"
          >
            &#9998; {{ t("artefactEditor.rejectWithComment") }}
          </button>

          <button
            type="button"
            class="artefact-btn artefact-btn--ghost"
            @click="onClose"
          >
            &#10005;
          </button>
        </div>
      </header>

      <div v-if="isLoading" class="artefact-editor-loading">
        <span>{{ t("artefactEditor.loading") }}</span>
      </div>

      <div v-else-if="loadError" class="artefact-editor-error">
        <p>{{ loadError }}</p>
        <button type="button" class="artefact-btn" @click="fetchContent">
          {{ t("artefactEditor.retry") }}
        </button>
      </div>

      <div v-else-if="activeTab === 'code'" class="artefact-editor-body">
        <div class="artefact-editor-gutter">
          <div
            v-for="lineNum in lineCount"
            :key="lineNum"
            class="artefact-editor-gutter__line"
          >
            {{ lineNum }}
          </div>
        </div>
        <textarea
          ref="textareaRef"
          v-model="editorContent"
          class="artefact-editor-textarea"
          spellcheck="false"
          @keydown="onTextareaKeydown"
        />
      </div>

      <div v-else class="artefact-diff-container">
        <div v-if="!diffSummary.hasChanges" class="artefact-diff-empty">
          {{ t("artefactEditor.noDiff") }}
        </div>
        <div
          v-for="(diffLine, idx) in diffSummary.lines"
          :key="idx"
          class="artefact-diff-row"
          :class="`artefact-diff-row--${diffLine.type}`"
          @click="
            selectLineForFeedback(
              diffLine.modifiedLineNumber ?? diffLine.originalLineNumber,
            )
          "
        >
          <span class="artefact-diff-line-num">
            {{ diffLine.originalLineNumber ?? "" }}
          </span>
          <span class="artefact-diff-line-num">
            {{ diffLine.modifiedLineNumber ?? "" }}
          </span>
          <span class="artefact-diff-sign">
            {{
              diffLine.type === "added" ? "+" : diffLine.type === "removed" ? "-" : " "
            }}
          </span>
          <span class="artefact-diff-text">{{ diffLine.text }}</span>
        </div>
      </div>

      <div v-if="showRejectComment" class="artefact-reject-box">
        <span class="artefact-reject-line-label">
          {{ t("artefactEditor.line") }}:
        </span>
        <input
          v-model.number="rejectLineNumber"
          type="number"
          min="1"
          class="artefact-reject-line-input"
        />
        <input
          v-model="rejectCommentText"
          type="text"
          class="artefact-reject-comment-input"
          :placeholder="t('artefactEditor.commentPlaceholder')"
          @keydown.enter="submitRejectComment"
        />
        <button
          type="button"
          class="artefact-btn artefact-btn--warning"
          :disabled="isRejecting || !rejectCommentText.trim()"
          @click="submitRejectComment"
        >
          {{ t("artefactEditor.sendFeedback") }}
        </button>
        <button
          type="button"
          class="artefact-btn artefact-btn--ghost"
          @click="showRejectComment = false"
        >
          {{ t("artefactEditor.cancel") }}
        </button>
      </div>

      <footer class="artefact-editor-footer">
        <span class="artefact-editor-footer__stat">
          {{ lineCount }} {{ t("artefactEditor.lines") }} &bull;
          {{ editorContent.length }} bytes
        </span>
        <span v-if="actionSuccessText" class="artefact-editor-footer__success">
          &check; {{ actionSuccessText }}
        </span>
        <span v-if="saveError" class="artefact-editor-footer__error">
          {{ saveError }}
        </span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useArtifactEditor } from "./useArtifactEditor";

const props = defineProps<{
  visible: boolean;
  taskId: string | null;
  filePath: string;
}>();

const emit = defineEmits<{
  close: [];
  saved: [{ path: string; content: string }];
  approved: [{ path: string }];
  rejected: [{ path: string; comment: string }];
}>();

const { t } = useI18n();
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const {
  activeTab,
  editorContent,
  isLoading,
  isSaving,
  isApproving,
  isRejecting,
  loadError,
  saveError,
  actionSuccessText,
  showRejectComment,
  rejectLineNumber,
  rejectCommentText,
  isDirty,
  lineCount,
  diffSummary,
  fetchContent,
  onSave,
  onApproveWithEdits,
  toggleRejectBox,
  selectLineForFeedback,
  submitRejectComment,
  handleKeydown,
} = useArtifactEditor({
  taskId: () => props.taskId,
  filePath: () => props.filePath,
  visible: () => props.visible,
  onSaved: (payload) => emit("saved", payload),
  onApproved: (payload) => emit("approved", payload),
  onRejected: (payload) => emit("rejected", payload),
});

function onTextareaKeydown(event: KeyboardEvent): void {
  handleKeydown(event, textareaRef.value);
}

function onClose(): void {
  emit("close");
}
</script>

<style scoped src="./artefact-editor-modal.css"></style>
