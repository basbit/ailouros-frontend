import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useUxStore } from "@/shared/store/ux";
import { useProjectsStore } from "@/entities/project";
import { useI18n } from "@/shared/lib/i18n";
import { httpGet } from "@/shared/api/http";
import { confirmAndRetryTask } from "./tabs/useHistoryDetailActions";

export type StatusFilter = "all" | "completed" | "failed" | "running";
export type StatusFamily = "ok" | "fail" | "run" | "pending" | "warn";

interface ResumeOptionsResponse {
  can_resume: boolean;
  resume_step?: string;
  reason?: string;
}

const RESUMABLE_STATUSES = new Set([
  "failed",
  "cancelled",
  "awaiting_human",
  "completed_with_failures",
  "completed_no_writes",
  "in_progress",
  "running",
]);

export function useHistoryListActions() {
  const router = useRouter();
  const ui = useUiStore();
  const ux = useUxStore();
  const projectsStore = useProjectsStore();
  const { t } = useI18n();

  const searchQuery = ref("");
  const statusFilter = ref<StatusFilter>("all");
  const resumeBusyId = ref<string>("");

  function statusFamily(status: HistoryEntry["status"]): StatusFamily {
    if (status === "completed" || status === "completed_no_writes") return "ok";
    if (status === "completed_with_failures") return "warn";
    if (status === "failed" || status === "cancelled") return "fail";
    if (status === "running" || status === "in_progress") return "run";
    return "pending";
  }

  const filteredEntries = computed<HistoryEntry[]>(() => {
    const term = searchQuery.value.trim().toLowerCase();
    const filter = statusFilter.value;
    return ui.historyList.filter((entry) => {
      if (filter !== "all") {
        const family = statusFamily(entry.status);
        if (filter === "completed" && family !== "ok") return false;
        if (filter === "failed" && family !== "fail") return false;
        if (filter === "running" && family !== "run") return false;
      }
      if (term && !(entry.prompt ?? "").toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  });

  function canResume(entry: HistoryEntry): boolean {
    if (!entry.taskId) return false;
    const status = (entry.status ?? "").toString().toLowerCase();
    return RESUMABLE_STATUSES.has(status);
  }

  async function onResumeEntry(entry: HistoryEntry): Promise<void> {
    const taskId = entry.taskId;
    if (!taskId) return;
    resumeBusyId.value = entry.id;
    try {
      const options = await httpGet<ResumeOptionsResponse>(
        `/v1/tasks/${encodeURIComponent(taskId)}/resume-options`,
      );
      if (!options.can_resume) {
        await ux.alertDialog({
          title: t("history.detail.resume.title"),
          message: t("history.detail.resume.noState"),
        });
        return;
      }
      const stepId = (options.resume_step ?? "").trim();
      await confirmAndRetryTask({ taskId, stepId, ux, t });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ux.alertDialog({
        title: t("history.detail.resume.failedTitle"),
        message: t("history.detail.resume.failed", { error: message }),
      });
    } finally {
      resumeBusyId.value = "";
    }
  }

  async function onClearHistory(): Promise<void> {
    const confirmed = await ux.confirmDialog({
      title: t("history.list.clearConfirmTitle"),
      message: t("history.list.clearConfirmMessage", {
        count: ui.historyList.length,
      }),
    });
    if (!confirmed) return;
    ui.clearHistory(projectsStore.currentId);
    ux.notify(t("history.list.cleared"), "info", 2500);
  }

  function onOpen(id: string): void {
    void router.push(`/history/${id}`);
  }

  function escapeCsv(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  function onExportCsv(): void {
    const lines = ["started_at,prompt,status,duration_ms,steps,task_id"];
    for (const entry of filteredEntries.value) {
      const startedAt = entry.startedAt ?? entry.at ?? "";
      const prompt = entry.prompt ?? "";
      const status = entry.status ?? "";
      const duration = entry.durationMs ?? "";
      const steps = entry.pipeline_steps?.length ?? 0;
      const taskId = entry.taskId ?? "";
      lines.push(
        [
          startedAt,
          escapeCsv(prompt),
          escapeCsv(status),
          duration,
          steps,
          escapeCsv(taskId),
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ailouros-history-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    searchQuery,
    statusFilter,
    resumeBusyId,
    filteredEntries,
    statusFamily,
    canResume,
    onResumeEntry,
    onClearHistory,
    onOpen,
    onExportCsv,
  };
}
