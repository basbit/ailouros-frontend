import { computed, nextTick, ref, watch, type Ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { computeLineDiff, type DiffSummary } from "@/shared/lib/diff";
import {
  approveWithEdits,
  getWorkspaceFile,
  patchWorkspaceFile,
} from "@/shared/api/endpoints/workspace";
import { postConfirmHuman } from "@/shared/api/endpoints/task-gates";

export interface UseArtifactEditorOptions {
  taskId: Ref<string | null> | (() => string | null);
  filePath: Ref<string> | (() => string);
  visible?: Ref<boolean> | (() => boolean);
  onSaved?: (payload: { path: string; content: string }) => void;
  onApproved?: (payload: { path: string }) => void;
  onRejected?: (payload: { path: string; comment: string }) => void;
}

export function useArtifactEditor(options: UseArtifactEditorOptions) {
  const { t } = useI18n();

  const activeTab = ref<"code" | "diff">("code");
  const originalContent = ref("");
  const editorContent = ref("");
  const isLoading = ref(false);
  const isSaving = ref(false);
  const isApproving = ref(false);
  const isRejecting = ref(false);
  const loadError = ref<string | null>(null);
  const saveError = ref<string | null>(null);
  const actionSuccessText = ref<string | null>(null);

  const showRejectComment = ref(false);
  const rejectLineNumber = ref<number | null>(1);
  const rejectCommentText = ref("");

  const resolveTaskId = (): string | null => {
    return typeof options.taskId === "function"
      ? options.taskId()
      : options.taskId.value;
  };

  const resolveFilePath = (): string => {
    return typeof options.filePath === "function"
      ? options.filePath()
      : options.filePath.value;
  };

  const isDirty = computed(() => editorContent.value !== originalContent.value);
  const lineCount = computed(() =>
    editorContent.value ? editorContent.value.split("\n").length : 1,
  );
  const diffSummary = computed<DiffSummary>(() =>
    computeLineDiff(originalContent.value, editorContent.value),
  );

  function showSuccessNotification(text: string): void {
    actionSuccessText.value = text;
    setTimeout(() => {
      if (actionSuccessText.value === text) {
        actionSuccessText.value = null;
      }
    }, 2500);
  }

  async function fetchContent(): Promise<void> {
    const currentTaskId = resolveTaskId();
    const currentFilePath = resolveFilePath();
    if (!currentTaskId || !currentFilePath) return;

    isLoading.value = true;
    loadError.value = null;
    saveError.value = null;
    actionSuccessText.value = null;
    try {
      const fileResponse = await getWorkspaceFile(currentTaskId, currentFilePath);
      originalContent.value = fileResponse.content ?? "";
      editorContent.value = fileResponse.content ?? "";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      loadError.value = message;
    } finally {
      isLoading.value = false;
    }
  }

  async function onSave(): Promise<void> {
    const currentTaskId = resolveTaskId();
    const currentFilePath = resolveFilePath();
    if (!currentTaskId || !currentFilePath || isSaving.value || !isDirty.value) return;

    isSaving.value = true;
    saveError.value = null;
    try {
      await patchWorkspaceFile(currentTaskId, currentFilePath, editorContent.value);
      originalContent.value = editorContent.value;
      showSuccessNotification(t("artefactEditor.savedSuccess"));
      options.onSaved?.({ path: currentFilePath, content: editorContent.value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      saveError.value = message;
    } finally {
      isSaving.value = false;
    }
  }

  async function onApproveWithEdits(): Promise<void> {
    const currentTaskId = resolveTaskId();
    const currentFilePath = resolveFilePath();
    if (!currentTaskId || !currentFilePath || isApproving.value) return;

    isApproving.value = true;
    saveError.value = null;
    try {
      await approveWithEdits(currentTaskId, currentFilePath, editorContent.value);
      originalContent.value = editorContent.value;
      showSuccessNotification(t("artefactEditor.approvedSuccess"));
      options.onSaved?.({ path: currentFilePath, content: editorContent.value });
      options.onApproved?.({ path: currentFilePath });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      saveError.value = message;
    } finally {
      isApproving.value = false;
    }
  }

  function toggleRejectBox(): void {
    showRejectComment.value = !showRejectComment.value;
  }

  function selectLineForFeedback(lineNum: number | null): void {
    if (lineNum) {
      rejectLineNumber.value = lineNum;
      showRejectComment.value = true;
    }
  }

  async function submitRejectComment(): Promise<void> {
    const currentTaskId = resolveTaskId();
    const currentFilePath = resolveFilePath();
    if (!currentTaskId || !rejectCommentText.value.trim() || isRejecting.value) return;

    isRejecting.value = true;
    saveError.value = null;
    const linePrefix = rejectLineNumber.value ? `Line ${rejectLineNumber.value}: ` : "";
    const feedback = `${linePrefix}${rejectCommentText.value.trim()}`;
    try {
      await postConfirmHuman(currentTaskId, false, feedback);
      showSuccessNotification(t("artefactEditor.rejectedSuccess"));
      options.onRejected?.({ path: currentFilePath, comment: feedback });
      showRejectComment.value = false;
      rejectCommentText.value = "";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      saveError.value = message;
    } finally {
      isRejecting.value = false;
    }
  }

  function handleKeydown(
    event: KeyboardEvent,
    textareaElement?: HTMLTextAreaElement | null,
  ): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void onSave();
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      if (!textareaElement) return;
      const start = textareaElement.selectionStart;
      const end = textareaElement.selectionEnd;
      const currentText = editorContent.value;
      editorContent.value =
        currentText.substring(0, start) + "  " + currentText.substring(end);
      void nextTick(() => {
        textareaElement.selectionStart = textareaElement.selectionEnd = start + 2;
      });
    }
  }

  if (options.visible) {
    watch(
      () =>
        [
          typeof options.visible === "function"
            ? options.visible()
            : options.visible?.value,
          resolveFilePath(),
          resolveTaskId(),
        ] as const,
      ([visible, path, taskId]) => {
        if (visible && path && taskId) {
          activeTab.value = "code";
          showRejectComment.value = false;
          void fetchContent();
        }
      },
      { immediate: true },
    );
  }

  return {
    activeTab,
    originalContent,
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
  };
}
