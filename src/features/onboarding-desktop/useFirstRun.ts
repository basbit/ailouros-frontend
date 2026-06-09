import { computed, reactive, readonly, ref } from "vue";
import {
  DESKTOP_EVENTS,
  invokeCommand,
  isDesktop,
  listenEvent,
  probeDesktop,
} from "@/shared/lib/desktop-bridge";
import type {
  LlmOnboardingPath,
  LocalLlmDetection,
} from "@/shared/lib/local-llm-detect";
import type { LocalProviderProbe } from "@/shared/api/endpoints/onboarding";
import type {
  BootstrapProgress,
  BootstrapStage,
  BootstrapStatusView,
  StageRuntimeView,
} from "./types";
import {
  applyProgressEvent,
  refreshLocalProviderDetection as refreshDetection,
  type InternalStageState,
} from "./first-run-helpers";

const VISIBLE_STAGES: BootstrapStage[] = [
  "fetching-python",
  "staging-mcp-runtimes",
  "creating-venv",
  "staging-llama-cpp",
  "downloading-model",
  "waiting-for-backend",
];

function emptyStageMap(): Record<BootstrapStage, InternalStageState> {
  const map = {} as Record<BootstrapStage, InternalStageState>;
  for (const stage of VISIBLE_STAGES) {
    map[stage] = { state: "pending", fraction: 0, message: "" };
  }
  return map;
}

export function useFirstRun() {
  const desktop = ref(isDesktop());
  const ready = ref(false);
  const dismissed = ref(false);
  const error = ref<string | null>(null);
  const stageMap =
    reactive<Record<BootstrapStage, InternalStageState>>(emptyStageMap());
  const detectedProviders = ref<LocalLlmDetection | null>(null);
  const recommendedPath = ref<LlmOnboardingPath | null>(null);
  const localProviderProbes = ref<LocalProviderProbe[]>([]);
  const backendFailureMessage = ref<string | null>(null);
  const desktopLogTail = ref<string | null>(null);

  let unlistenProgress: (() => void) | null = null;

  async function ensureDesktop(): Promise<boolean> {
    if (desktop.value) return true;
    desktop.value = await probeDesktop();
    return desktop.value;
  }

  function applyDoneFromStatus(status: BootstrapStatusView): void {
    for (const entry of status.stages) {
      if (!(entry.stage in stageMap)) continue;
      if (entry.done) {
        stageMap[entry.stage] = {
          state:
            entry.stage === "downloading-model" && status.default_model_skipped
              ? "skipped"
              : "done",
          fraction: 1,
          message: "",
        };
      }
    }
    const modelMissing = !status.default_model_present;
    const skippedButMissing = status.default_model_skipped && modelMissing;
    if (status.all_required_done && !skippedButMissing) {
      ready.value = true;
    }
  }

  async function loadStatus(): Promise<BootstrapStatusView | null> {
    if (!(await ensureDesktop())) return null;
    try {
      const status = await invokeCommand<BootstrapStatusView>("get_bootstrap_status");
      applyDoneFromStatus(status);
      return status;
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : String(loadError);
      return null;
    }
  }

  function applyProgress(progress: BootstrapProgress): void {
    applyProgressEvent(progress, {
      visibleStages: VISIBLE_STAGES,
      stageMap,
      ready,
      backendFailureMessage,
      onFailed: () => void loadDesktopLogs(),
    });
  }

  async function loadDesktopLogs(): Promise<void> {
    if (!(await ensureDesktop())) return;
    try {
      desktopLogTail.value = await invokeCommand<string>("read_desktop_logs", {
        maxLinesPerFile: 80,
      });
    } catch (logError) {
      desktopLogTail.value =
        logError instanceof Error ? logError.message : String(logError);
    }
  }

  async function retryBootstrap(): Promise<void> {
    if (!(await ensureDesktop())) return;
    backendFailureMessage.value = null;
    desktopLogTail.value = null;
    error.value = null;
    stageMap["waiting-for-backend"] = {
      state: "active",
      fraction: 0,
      message: "",
    };
    try {
      await invokeCommand<void>("retry_bootstrap");
      await loadStatus();
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : String(retryError);
      backendFailureMessage.value = message;
      stageMap["waiting-for-backend"] = {
        state: "error",
        fraction: 0,
        message,
      };
      void loadDesktopLogs();
    }
  }

  async function revealLogsFolder(): Promise<void> {
    if (!(await ensureDesktop())) return;
    try {
      await invokeCommand<string>("reveal_logs_folder");
    } catch (openError) {
      error.value = openError instanceof Error ? openError.message : String(openError);
    }
  }

  async function subscribe(): Promise<void> {
    if (unlistenProgress || !desktop.value) return;
    unlistenProgress = await listenEvent<BootstrapProgress>(
      DESKTOP_EVENTS.bootstrapProgress,
      applyProgress,
    );
  }

  async function refreshLocalProviderDetection(): Promise<void> {
    await refreshDetection({
      detectedProviders,
      recommendedPath,
      localProviderProbes,
      error,
    });
  }

  async function start(): Promise<void> {
    if (!(await ensureDesktop())) return;
    await Promise.all([loadStatus(), refreshLocalProviderDetection()]);
    await subscribe();
  }

  async function skipModel(): Promise<void> {
    if (!(await ensureDesktop())) return;
    try {
      await invokeCommand<void>("skip_default_model");
      stageMap["downloading-model"] = { state: "skipped", fraction: 1, message: "" };
      await loadStatus();
    } catch (skipError) {
      error.value = skipError instanceof Error ? skipError.message : String(skipError);
    }
  }

  async function retryModelDownload(): Promise<void> {
    if (!(await ensureDesktop())) return;
    error.value = null;
    stageMap["downloading-model"] = { state: "active", fraction: 0, message: "" };
    await subscribe();
    try {
      await invokeCommand<void>("retry_default_model_download");
      await loadStatus();
    } catch (retryError) {
      const message =
        retryError instanceof Error ? retryError.message : String(retryError);
      error.value = message;
      stageMap["downloading-model"] = {
        state: "error",
        fraction: 0,
        message,
      };
    }
  }

  async function dismiss(): Promise<void> {
    dismissed.value = true;
    if (!desktop.value) return;
    try {
      await invokeCommand<void>("mark_first_run_complete");
    } catch {
      return;
    }
  }

  function dispose(): void {
    if (unlistenProgress) {
      unlistenProgress();
      unlistenProgress = null;
    }
  }

  const stages = computed<StageRuntimeView[]>(() =>
    VISIBLE_STAGES.map((stage) => ({
      stage,
      state: stageMap[stage].state,
      fraction: stageMap[stage].fraction,
      message: stageMap[stage].message,
    })),
  );

  const visible = computed(() => desktop.value && !dismissed.value && !ready.value);

  return {
    isDesktop: readonly(desktop),
    ready: readonly(ready),
    dismissed: readonly(dismissed),
    error: readonly(error),
    stages,
    visible,
    detectedProviders: readonly(detectedProviders),
    recommendedPath: readonly(recommendedPath),
    localProviderProbes: readonly(localProviderProbes),
    backendFailureMessage: readonly(backendFailureMessage),
    desktopLogTail: readonly(desktopLogTail),
    start,
    skipModel,
    retryModelDownload,
    refreshLocalProviderDetection,
    loadDesktopLogs,
    retryBootstrap,
    revealLogsFolder,
    dismiss,
    dispose,
  };
}
