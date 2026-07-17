import { computed, onMounted, ref } from "vue";
import { useUiStore, type HistoryEntry } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { resolveTaskFromServer } from "@/shared/lib/hydrate-task";
import { isTaskTerminal } from "@/shared/lib/task-status";
import type { RunAvailability } from "@/shared/model/task-types";

export type RunDoneFamily = "ok" | "fail" | "warn" | "run" | "pending";

export function useRunDoneSummary(runId: string) {
  const ui = useUiStore();
  const { t } = useI18n();

  const serverStatus = ref<string | null>(null);
  const availability = ref<RunAvailability>("unresolved");
  const lookupError = ref<string | null>(null);

  onMounted(async () => {
    const resolution = await resolveTaskFromServer(runId);
    if (resolution.outcome === "unknown") {
      availability.value = "unavailable";
      return;
    }
    if (resolution.outcome === "error") {
      availability.value = "lookup_failed";
      lookupError.value = resolution.message;
      return;
    }
    availability.value = "resolved";
    serverStatus.value = resolution.task.status;
  });

  const historyEntry = computed<HistoryEntry | null>(
    () => ui.historyList.find((entry) => entry.taskId === runId) ?? null,
  );

  const historyId = computed(() => historyEntry.value?.id ?? null);

  const isTerminal = computed(
    () => availability.value === "resolved" && isTaskTerminal(serverStatus.value ?? ""),
  );

  const statusLabel = computed<string>(() => serverStatus.value ?? "—");

  const family = computed<RunDoneFamily>(() => {
    const status = serverStatus.value;
    if (status === "completed" || status === "completed_no_writes") return "ok";
    if (status === "completed_with_failures") return "warn";
    if (status === "failed" || status === "cancelled") return "fail";
    if (status === "running" || status === "in_progress") return "run";
    return "pending";
  });

  const title = computed<string>(() => {
    if (availability.value === "unavailable") return t("runDone.titleUnavailable");
    if (availability.value === "lookup_failed") return t("runDone.titleUnknownStatus");
    if (isTerminal.value) {
      if (serverStatus.value === "cancelled") return t("runDone.titleCancelled");
      if (family.value === "fail") return t("runDone.titleFailed");
      if (family.value === "warn") return t("runDone.titleWithFailures");
      return t("runDone.title");
    }
    if (serverStatus.value) {
      return t("runDone.titleUnfinished", { status: serverStatus.value });
    }
    return t("runDone.titleUnknownStatus");
  });

  const checkSymbol = computed(() => {
    if (family.value === "ok") return "✓";
    if (family.value === "fail") return "✕";
    if (family.value === "warn") return "!";
    return "•";
  });

  const duration = computed(() => {
    const elapsedMs = historyEntry.value?.durationMs ?? null;
    if (!elapsedMs || elapsedMs <= 0) return "—";
    const totalSeconds = Math.round(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes === 0) return `${totalSeconds}s`;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  });

  const stepCount = computed(() => historyEntry.value?.pipeline_steps?.length ?? 0);

  const artifactPath = computed<string | null>(
    () => historyEntry.value?.workspace_root?.trim() || null,
  );

  return {
    availability,
    lookupError,
    historyId,
    statusLabel,
    title,
    family,
    checkSymbol,
    duration,
    stepCount,
    artifactPath,
  };
}
