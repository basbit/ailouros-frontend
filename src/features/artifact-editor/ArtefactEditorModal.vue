<template>
  <div v-if="visible" class="artefact-editor-overlay" @click.self="onClose">
    <div
      ref="dialogRef"
      class="artefact-editor-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="filePath"
      @keydown="onDialogKeydown"
    >
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
            :aria-label="t('common.close')"
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
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";
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
const ux = useUxStore();
const dialogRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
let focusOrigin: HTMLElement | null = null;

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

function focusableElements(): HTMLElement[] {
  if (!dialogRef.value) return [];
  return Array.from(
    dialogRef.value.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    ),
  );
}

function trapTab(event: KeyboardEvent): void {
  const focusable = focusableElements();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") {
    event.preventDefault();
    void onClose();
    return;
  }
  if (event.key === "Tab") trapTab(event);
}

// A keydown handler on a div only fires once focus is inside it, so Escape also
// needs a window listener while the editor is open.
function onWindowKeydown(event: KeyboardEvent): void {
  if (props.visible && event.key === "Escape") {
    event.preventDefault();
    void onClose();
  }
}

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      focusOrigin = document.activeElement as HTMLElement | null;
      window.addEventListener("keydown", onWindowKeydown);
      void nextTick(() => {
        (textareaRef.value ?? focusableElements()[0] ?? null)?.focus();
      });
    } else {
      window.removeEventListener("keydown", onWindowKeydown);
      focusOrigin?.focus();
      focusOrigin = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onWindowKeydown);
});

async function onClose(): Promise<void> {
  // Closing used to drop unsaved edits without asking.
  if (isDirty.value) {
    const discard = await ux.confirmDialog({
      title: t("artefactEditor.discardTitle"),
      message: t("artefactEditor.discardMessage"),
      confirmLabel: t("artefactEditor.discardConfirm"),
      cancelLabel: t("artefactEditor.cancel"),
    });
    if (!discard) return;
  }
  emit("close");
}
</script>

<style scoped src="./artefact-editor-modal.css"></style>
