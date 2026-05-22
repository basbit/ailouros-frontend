import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import { getInstalledPlugins, uninstallPlugin } from "@/shared/api/endpoints/plugins";
import { describeApiError } from "@/shared/lib/describe-api-error";
import type { PluginManifest } from "./plugin-types";

export interface UseInstalledPluginsState {
  installedPlugins: Ref<PluginManifest[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  uninstalling: Ref<Record<string, boolean>>;
  load: () => Promise<void>;
  uninstall: (id: string) => Promise<void>;
  reset: () => void;
}

export function useInstalledPlugins(): UseInstalledPluginsState {
  const installedPlugins = ref<PluginManifest[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const uninstalling = ref<Record<string, boolean>>({});

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      installedPlugins.value = await getInstalledPlugins();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        installedPlugins.value = [];
        return;
      }
      error.value = describeApiError(err, "Failed to load installed plugins.");
    } finally {
      loading.value = false;
    }
  }

  async function uninstall(id: string): Promise<void> {
    if (!id) return;
    uninstalling.value = { ...uninstalling.value, [id]: true };
    error.value = null;
    try {
      await uninstallPlugin(id);
      installedPlugins.value = installedPlugins.value.filter((p) => p.id !== id);
    } catch (err) {
      error.value = describeApiError(err, `Failed to uninstall ${id}.`);
    } finally {
      const next = { ...uninstalling.value };
      delete next[id];
      uninstalling.value = next;
    }
  }

  function reset(): void {
    installedPlugins.value = [];
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    uninstalling.value = {};
  }

  return {
    installedPlugins,
    loading,
    error,
    notImplemented,
    uninstalling,
    load,
    uninstall,
    reset,
  };
}
