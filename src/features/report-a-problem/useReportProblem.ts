import { computed, ref } from "vue";
import { invokeCommand, isDesktop } from "@/shared/lib/desktop-bridge";
import { useUiStore } from "@/shared/store/ui";

const RECENT_HISTORY_LIMIT = 12;
const DESKTOP_LOG_MAX_LINES_PER_FILE = 120;

const reportProblemOpen = ref(false);
const reportDesktopLog = ref<string>("");

export function useReportProblem() {
  const ui = useUiStore();

  const reportRecentLog = computed(() => {
    const taskLog = ui.taskHistory
      .slice(-RECENT_HISTORY_LIMIT)
      .map((entry) => {
        const agent = entry.agent ? `[${entry.agent}] ` : "";
        return `${agent}${entry.message ?? ""}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
    if (reportDesktopLog.value) {
      return [taskLog, reportDesktopLog.value].filter(Boolean).join("\n\n");
    }
    return taskLog;
  });

  const reportArtifactPaths = computed(() => {
    const paths: string[] = [];
    if (ui.artifactPath) paths.push(ui.artifactPath);
    const plan = ui.taskPipelinePlan as Record<string, unknown> | null;
    const artifactsDir = plan?.artifacts_dir;
    if (typeof artifactsDir === "string" && artifactsDir.trim()) {
      paths.push(artifactsDir.trim());
    }
    return paths;
  });

  async function openReportProblem(): Promise<void> {
    reportDesktopLog.value = "";
    if (isDesktop()) {
      const tail = await invokeCommand<string>("read_desktop_logs", {
        maxLinesPerFile: DESKTOP_LOG_MAX_LINES_PER_FILE,
      });
      if (typeof tail === "string" && tail.trim()) {
        reportDesktopLog.value = tail.trim();
      }
    }
    reportProblemOpen.value = true;
  }

  function closeReportProblem(): void {
    reportProblemOpen.value = false;
  }

  return {
    reportProblemOpen,
    reportRecentLog,
    reportArtifactPaths,
    openReportProblem,
    closeReportProblem,
  };
}
