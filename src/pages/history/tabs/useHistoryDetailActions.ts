import { ref, type Ref } from "vue";
import { httpGet, httpPost } from "@/shared/api/http";

export interface ResumeTaskUx {
  alertDialog: (params: { title: string; message: string }) => Promise<void>;
  confirmDialog: (params: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
}

type ResumeTranslator = (
  key: string,
  args?: Record<string, string | number | null | undefined>,
) => string;

export async function confirmAndRetryTask(options: {
  taskId: string;
  stepId: string;
  ux: ResumeTaskUx;
  t: ResumeTranslator;
}): Promise<void> {
  const { taskId, stepId, ux, t } = options;
  const confirmed = await ux.confirmDialog({
    title: t("history.detail.resume.title"),
    message: t("history.detail.resume.confirm", { step: stepId || "?" }),
    confirmLabel: t("history.detail.resume.confirmAction"),
  });
  if (!confirmed) return;
  await httpPost(`/v1/tasks/${encodeURIComponent(taskId)}/retry`, {
    stream: false,
    from_step: stepId || null,
  });
  await ux.alertDialog({
    title: t("history.detail.resume.title"),
    message: t("history.detail.resume.success", { step: stepId || "?" }),
  });
}

interface WorkspaceSnapshotResponse {
  available: boolean;
  snapshot?: Record<string, unknown>;
  workspace_root?: string;
  reason?: string;
}

interface ResumeOptionsResponse {
  can_resume: boolean;
  resume_step?: string;
  reason?: string;
}

interface UxLike {
  alertDialog: (params: { title: string; message: string }) => Promise<void>;
  confirmDialog: (params: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
}

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export function useHistoryDetailActions(options: {
  ux: UxLike;
  t: TranslatorLike;
  workspaceRootForRun: Ref<string>;
  getTaskId: () => string | null | undefined;
}) {
  const { ux, t, workspaceRootForRun, getTaskId } = options;
  const rollbackBusy = ref<boolean>(false);
  const resumeBusy = ref<boolean>(false);
  const resumeAvailable = ref<boolean>(false);
  const resumeStepId = ref<string>("");

  async function loadResumeOptions(taskId: string): Promise<void> {
    try {
      const opts = await httpGet<ResumeOptionsResponse>(
        `/v1/tasks/${encodeURIComponent(taskId)}/resume-options`,
      );
      resumeAvailable.value = Boolean(opts.can_resume);
      resumeStepId.value = (opts.resume_step ?? "").trim();
    } catch {
      resumeAvailable.value = false;
      resumeStepId.value = "";
    }
  }

  async function onRollbackTo(stepId: string): Promise<void> {
    const taskId = getTaskId();
    if (!taskId) return;
    rollbackBusy.value = true;
    try {
      const handlePayload = await httpGet<WorkspaceSnapshotResponse>(
        `/v1/tasks/${encodeURIComponent(taskId)}/workspace-snapshot`,
      );
      if (!handlePayload.available || !handlePayload.snapshot) {
        await ux.alertDialog({
          title: t("history.detail.rollback.title"),
          message: t("history.detail.rollback.noSnapshot"),
        });
        return;
      }
      const workspaceRootForRollback =
        handlePayload.workspace_root || workspaceRootForRun.value;
      if (!workspaceRootForRollback) {
        await ux.alertDialog({
          title: t("history.detail.rollback.title"),
          message: t("history.detail.rollback.noSnapshot"),
        });
        return;
      }
      const confirmed = await ux.confirmDialog({
        title: t("history.detail.rollback.title"),
        message: t("history.detail.rollback.confirm", { step: stepId }),
        confirmLabel: t("history.detail.rollback.confirmAction"),
      });
      if (!confirmed) return;
      await httpPost(`/v1/tasks/${encodeURIComponent(taskId)}/rollback`, {
        snapshot: handlePayload.snapshot,
        workspace_root: workspaceRootForRollback,
      });
      await ux.alertDialog({
        title: t("history.detail.rollback.title"),
        message: t("history.detail.rollback.success", { step: stepId }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ux.alertDialog({
        title: t("history.detail.rollback.failedTitle"),
        message: t("history.detail.rollback.failed", { error: message }),
      });
    } finally {
      rollbackBusy.value = false;
    }
  }

  async function onResumeFromFailedStep(): Promise<void> {
    const taskId = getTaskId();
    if (!taskId) return;
    resumeBusy.value = true;
    try {
      if (!resumeAvailable.value) {
        await loadResumeOptions(taskId);
      }
      if (!resumeAvailable.value) {
        await ux.alertDialog({
          title: t("history.detail.resume.title"),
          message: t("history.detail.resume.noState"),
        });
        return;
      }
      await confirmAndRetryTask({ taskId, stepId: resumeStepId.value, ux, t });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ux.alertDialog({
        title: t("history.detail.resume.failedTitle"),
        message: t("history.detail.resume.failed", { error: message }),
      });
    } finally {
      resumeBusy.value = false;
    }
  }

  return {
    rollbackBusy,
    resumeBusy,
    resumeAvailable,
    resumeStepId,
    loadResumeOptions,
    onRollbackTo,
    onResumeFromFailedStep,
  };
}
