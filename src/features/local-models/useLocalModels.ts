import { computed, reactive, readonly, ref } from "vue";
import {
  DESKTOP_EVENTS,
  invokeCommand,
  isDesktop,
  listenEvent,
  probeDesktop,
} from "@/shared/lib/desktop-bridge";
import type { AvailableModelView, BootstrapProgress, LocalModelView } from "./types";

interface DownloadState {
  fraction: Record<string, number>;
  message: Record<string, string>;
  active: string | null;
  error: string | null;
}

export function useLocalModels() {
  const desktop = ref(isDesktop());
  const available = ref<AvailableModelView[]>([]);
  const onDisk = ref<LocalModelView[]>([]);
  const loading = ref(false);
  const loadError = ref<string | null>(null);
  const download = reactive<DownloadState>({
    fraction: {},
    message: {},
    active: null,
    error: null,
  });

  let unlistenProgress: (() => void) | null = null;

  async function ensureDesktopFlag(): Promise<boolean> {
    if (desktop.value) return true;
    desktop.value = await probeDesktop();
    return desktop.value;
  }

  async function refresh(): Promise<void> {
    if (!(await ensureDesktopFlag())) return;
    loading.value = true;
    loadError.value = null;
    try {
      const [availableModels, localModels] = await Promise.all([
        invokeCommand<AvailableModelView[]>("list_available_models"),
        invokeCommand<LocalModelView[]>("list_local_models"),
      ]);
      available.value = availableModels;
      onDisk.value = localModels;
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error);
    } finally {
      loading.value = false;
    }
  }

  async function ensureProgressSubscription(): Promise<void> {
    if (unlistenProgress || !desktop.value) return;
    unlistenProgress = await listenEvent<BootstrapProgress>(
      DESKTOP_EVENTS.bootstrapProgress,
      (progress) => {
        if (progress.stage !== "downloading-model" || !download.active) return;
        download.fraction[download.active] = progress.fraction;
        download.message[download.active] = progress.message;
      },
    );
  }

  async function startDownload(id: string): Promise<void> {
    if (!(await ensureDesktopFlag())) {
      download.error = "desktop-only";
      return;
    }
    if (download.active) {
      download.error = `another download is in progress (${download.active})`;
      return;
    }
    download.active = id;
    download.error = null;
    download.fraction[id] = 0;
    download.message[id] = "starting";
    await ensureProgressSubscription();
    try {
      await invokeCommand<void>("download_model", { id });
      download.fraction[id] = 1;
      download.message[id] = "done";
      await refresh();
    } catch (error) {
      download.error = error instanceof Error ? error.message : String(error);
    } finally {
      download.active = null;
    }
  }

  function dispose(): void {
    if (unlistenProgress) {
      unlistenProgress();
      unlistenProgress = null;
    }
  }

  const defaultEntry = computed(
    () => available.value.find((model) => model.is_default) ?? null,
  );

  return {
    isDesktop: readonly(desktop),
    available: readonly(available),
    onDisk: readonly(onDisk),
    loading: readonly(loading),
    loadError: readonly(loadError),
    download: readonly(download),
    defaultEntry,
    refresh,
    startDownload,
    dispose,
    ensureDesktopFlag,
  };
}
