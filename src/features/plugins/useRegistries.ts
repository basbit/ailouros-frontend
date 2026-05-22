import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import {
  addRegistry,
  getRegistries,
  refreshRegistry,
} from "@/shared/api/endpoints/plugins";
import { describeApiError } from "@/shared/lib/describe-api-error";
import type { RegistryEntry } from "./plugin-types";

export interface UseRegistriesState {
  registries: Ref<RegistryEntry[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  refreshing: Ref<Record<string, boolean>>;
  adding: Ref<boolean>;
  load: () => Promise<void>;
  add: (url: string, name: string) => Promise<RegistryEntry | null>;
  refresh: (name: string) => Promise<void>;
  reset: () => void;
}

export function useRegistries(): UseRegistriesState {
  const registries = ref<RegistryEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const refreshing = ref<Record<string, boolean>>({});
  const adding = ref(false);

  async function load(): Promise<void> {
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      registries.value = await getRegistries();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        registries.value = [];
        return;
      }
      error.value = describeApiError(err, "Failed to load registries.");
    } finally {
      loading.value = false;
    }
  }

  async function add(url: string, name: string): Promise<RegistryEntry | null> {
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();
    if (!trimmedUrl || !trimmedName) {
      error.value = "Registry name and URL are required.";
      return null;
    }
    adding.value = true;
    error.value = null;
    try {
      const entry = await addRegistry(trimmedUrl, trimmedName);
      const next = registries.value.filter((r) => r.name !== entry.name);
      registries.value = [...next, entry];
      return entry;
    } catch (err) {
      error.value = describeApiError(err, "Failed to add registry.");
      return null;
    } finally {
      adding.value = false;
    }
  }

  async function refresh(name: string): Promise<void> {
    if (!name) return;
    refreshing.value = { ...refreshing.value, [name]: true };
    error.value = null;
    try {
      const updated = await refreshRegistry(name);
      registries.value = registries.value.map((r) =>
        r.name === name ? { ...r, ...updated } : r,
      );
    } catch (err) {
      error.value = describeApiError(err, `Failed to refresh ${name}.`);
    } finally {
      const next = { ...refreshing.value };
      delete next[name];
      refreshing.value = next;
    }
  }

  function reset(): void {
    registries.value = [];
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    refreshing.value = {};
    adding.value = false;
  }

  return {
    registries,
    loading,
    error,
    notImplemented,
    refreshing,
    adding,
    load,
    add,
    refresh,
    reset,
  };
}
