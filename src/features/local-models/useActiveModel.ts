import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { invokeCommand, isDesktop, probeDesktop } from "@/shared/lib/desktop-bridge";
import type { AvailableModelView } from "./types";

export type ActiveModelKind = "local" | "cloud" | "none";

export interface ActiveModelView {
  kind: ActiveModelKind;
  label: string | null;
}

export function useActiveModel() {
  const desktop = ref(isDesktop());
  const localPresent = ref(false);
  const localLabel = ref<string | null>(null);

  let pollHandle: ReturnType<typeof setInterval> | null = null;

  async function ensureDesktop(): Promise<boolean> {
    if (desktop.value) return true;
    desktop.value = await probeDesktop();
    return desktop.value;
  }

  async function refresh(): Promise<void> {
    if (!(await ensureDesktop())) return;
    try {
      const available = await invokeCommand<AvailableModelView[]>(
        "list_available_models",
      );
      const installed = available.find((entry) => entry.is_default && entry.on_disk);
      localPresent.value = installed !== undefined;
      localLabel.value = installed ? installed.entry.label : null;
    } catch {
      localPresent.value = false;
      localLabel.value = null;
    }
  }

  onMounted(() => {
    refresh();
    pollHandle = setInterval(refresh, 30_000);
  });

  onBeforeUnmount(() => {
    if (pollHandle !== null) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
  });

  const view = computed<ActiveModelView>(() => {
    if (!desktop.value) {
      return { kind: "cloud", label: null };
    }
    if (localPresent.value) {
      return { kind: "local", label: localLabel.value };
    }
    return { kind: "none", label: null };
  });

  return { view, refresh };
}

export type ActiveModelApi = ReturnType<typeof useActiveModel>;
