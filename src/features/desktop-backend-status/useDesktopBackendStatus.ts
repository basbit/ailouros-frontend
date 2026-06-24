import { computed, ref } from "vue";
import {
  DESKTOP_EVENTS,
  invokeCommand,
  isDesktop,
  listenEvent,
} from "@/shared/lib/desktop-bridge";
import type { BootstrapProgress, BootstrapStage } from "@/entities/bootstrap";

const LOG_TAIL_MAX_LINES_PER_FILE = 80;

export function useDesktopBackendStatus() {
  const desktop = ref(isDesktop());
  const stage = ref<BootstrapStage | null>(null);
  const message = ref<string>("");
  const logTail = ref<string | null>(null);
  const dismissed = ref(false);
  const retrying = ref(false);
  const lastError = ref<string | null>(null);

  let unlisten: (() => void) | null = null;

  async function loadLogs(): Promise<void> {
    if (!desktop.value) return;
    try {
      logTail.value = await invokeCommand<string>("read_desktop_logs", {
        maxLinesPerFile: LOG_TAIL_MAX_LINES_PER_FILE,
      });
    } catch (logError) {
      logTail.value = logError instanceof Error ? logError.message : String(logError);
    }
  }

  function onProgress(progress: BootstrapProgress): void {
    stage.value = progress.stage;
    message.value = progress.message;
    if (progress.stage === "failed") {
      dismissed.value = false;
      void loadLogs();
    }
    if (progress.stage === "ready") {
      dismissed.value = true;
      logTail.value = null;
      lastError.value = null;
    }
  }

  async function start(): Promise<void> {
    if (!desktop.value || unlisten) return;
    unlisten = await listenEvent<BootstrapProgress>(
      DESKTOP_EVENTS.bootstrapProgress,
      onProgress,
    );
  }

  function dispose(): void {
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
  }

  async function retry(): Promise<void> {
    if (!desktop.value || retrying.value) return;
    retrying.value = true;
    lastError.value = null;
    try {
      await invokeCommand<void>("retry_bootstrap");
      stage.value = "waiting-for-backend";
      message.value = "Restarting backend…";
      logTail.value = null;
    } catch (retryError) {
      const text =
        retryError instanceof Error ? retryError.message : String(retryError);
      lastError.value = text;
      stage.value = "failed";
      message.value = text;
      void loadLogs();
    } finally {
      retrying.value = false;
    }
  }

  async function openLogs(): Promise<void> {
    if (!desktop.value) return;
    try {
      await invokeCommand<string>("reveal_logs_folder");
    } catch (openError) {
      lastError.value =
        openError instanceof Error ? openError.message : String(openError);
    }
  }

  function dismiss(): void {
    dismissed.value = true;
  }

  const visible = computed(() => {
    if (!desktop.value || dismissed.value) return false;
    return stage.value === "failed";
  });

  return {
    desktop,
    stage,
    message,
    logTail,
    visible,
    retrying,
    lastError,
    start,
    dispose,
    retry,
    openLogs,
    dismiss,
  };
}
