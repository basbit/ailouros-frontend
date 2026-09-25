import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  getClarifyQuestions,
  getWorkspaceDiff,
  getWorkspaceFile,
  patchWorkspaceFile,
} from "@/shared/api/endpoints/workspace";
import { useI18n } from "@/shared/lib/i18n";
import { frontendLogger } from "@/shared/lib/frontend-logger";
import { formatUserEditDiff } from "./useFileFeedback";

export interface ClarifyQuestion {
  index: number;
  text: string;
  options: string[];
}

export interface WorkspaceDiffData {
  diffText: string;
  files: string[];
  stats: { added: number; removed: number; files: number };
  source: "git" | "file_list" | "none";
}

export function useHumanGateWorkspace(taskIdRef: Ref<string | undefined>) {
  const { t } = useI18n();

  const clarifyQuestions = ref<ClarifyQuestion[]>([]);
  const fetchError = ref<string | null>(null);
  const diffData = ref<WorkspaceDiffData | null>(null);

  const selectedEditPath = ref<string>("");
  const editContent = ref<string>("");
  const editOriginal = ref<string>("");
  const isEditLoading = ref<boolean>(false);
  const isEditSaving = ref<boolean>(false);
  const editError = ref<string | null>(null);
  const savedEditDiffs = ref<Record<string, string>>({});

  async function loadEditFile(path: string): Promise<void> {
    const taskId = taskIdRef.value;
    if (!taskId || !path) return;
    isEditLoading.value = true;
    editError.value = null;
    editContent.value = "";
    editOriginal.value = "";
    try {
      const data = await getWorkspaceFile(taskId, path);
      editContent.value = data.content ?? "";
      editOriginal.value = data.content ?? "";
    } catch (e) {
      editError.value =
        e instanceof ApiError
          ? `${t("humanGate.editLoadError")} (HTTP ${e.status})`
          : e instanceof Error
            ? e.message
            : String(e);
    } finally {
      isEditLoading.value = false;
    }
  }

  function onEditPathChange(): void {
    void loadEditFile(selectedEditPath.value);
  }

  async function saveEditedFile(): Promise<void> {
    const taskId = taskIdRef.value;
    if (!taskId || !selectedEditPath.value) return;
    isEditSaving.value = true;
    editError.value = null;
    try {
      await patchWorkspaceFile(taskId, selectedEditPath.value, editContent.value);
      savedEditDiffs.value = {
        ...savedEditDiffs.value,
        [selectedEditPath.value]: formatUserEditDiff(
          editOriginal.value,
          editContent.value,
        ),
      };
      editOriginal.value = editContent.value;
      void fetchWorkspaceDiff();
    } catch (e) {
      editError.value =
        e instanceof ApiError
          ? `${t("humanGate.editSaveError")} (HTTP ${e.status})`
          : e instanceof Error
            ? e.message
            : String(e);
    } finally {
      isEditSaving.value = false;
    }
  }

  function resetEditState(): void {
    selectedEditPath.value = "";
    savedEditDiffs.value = {};
    editContent.value = "";
    editOriginal.value = "";
    editError.value = null;
    isEditLoading.value = false;
    isEditSaving.value = false;
  }

  async function fetchWorkspaceDiff(): Promise<void> {
    const taskId = taskIdRef.value;
    if (!taskId) return;
    try {
      const data = await getWorkspaceDiff(taskId);
      if (Array.isArray(data.files_changed) && data.files_changed.length > 0) {
        const stats = data.stats ?? {};
        const source =
          data.source === "git" || data.source === "file_list" || data.source === "none"
            ? data.source
            : "file_list";
        diffData.value = {
          diffText: data.diff_text ?? "",
          files: data.files_changed,
          stats: {
            added: stats.added ?? 0,
            removed: stats.removed ?? 0,
            files: stats.files ?? (data.files_changed as string[]).length,
          },
          source,
        };
      }
    } catch (e) {
      frontendLogger.warn("[HumanGate] workspace-diff fetch failed", e);
    }
  }

  async function fetchClarifyQuestions(): Promise<void> {
    const taskId = taskIdRef.value;
    if (!taskId) return;
    fetchError.value = null;
    try {
      const data = await getClarifyQuestions(taskId);
      const qs: ClarifyQuestion[] = Array.isArray(data.questions) ? data.questions : [];
      clarifyQuestions.value = qs;
    } catch (e) {
      fetchError.value =
        e instanceof ApiError
          ? `${t("humanGate.fetchError")} (HTTP ${e.status})`
          : e instanceof Error
            ? e.message
            : String(e);
      clarifyQuestions.value = [];
    }
  }

  function clearDiff(): void {
    diffData.value = null;
  }

  return {
    clarifyQuestions,
    fetchError,
    diffData,
    selectedEditPath,
    editContent,
    editOriginal,
    isEditLoading,
    isEditSaving,
    editError,
    savedEditDiffs,
    loadEditFile,
    onEditPathChange,
    saveEditedFile,
    resetEditState,
    fetchWorkspaceDiff,
    fetchClarifyQuestions,
    clearDiff,
  };
}
