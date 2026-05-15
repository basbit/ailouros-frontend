import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import { installPlugin, searchPlugins } from "@/shared/api/endpoints/plugins";
import type { PluginManifest, SearchHit } from "./plugin-types";

export interface UsePluginSearchState {
  query: Ref<string>;
  results: Ref<SearchHit[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notImplemented: Ref<boolean>;
  installing: Ref<Map<string, boolean>>;
  search: (q?: string) => Promise<void>;
  install: (hit: SearchHit) => Promise<PluginManifest | null>;
  reset: () => void;
}

function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.body && err.body.trim()) return err.body;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function usePluginSearch(): UsePluginSearchState {
  const query = ref("");
  const results = ref<SearchHit[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notImplemented = ref(false);
  const installing = ref<Map<string, boolean>>(new Map());

  async function search(q?: string): Promise<void> {
    if (typeof q === "string") query.value = q;
    loading.value = true;
    error.value = null;
    notImplemented.value = false;
    try {
      results.value = await searchPlugins(query.value);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notImplemented.value = true;
        results.value = [];
        return;
      }
      error.value = describeError(err, "Failed to search plugins.");
    } finally {
      loading.value = false;
    }
  }

  async function install(hit: SearchHit): Promise<PluginManifest | null> {
    if (!hit.id) return null;
    const next = new Map(installing.value);
    next.set(hit.id, true);
    installing.value = next;
    error.value = null;
    try {
      return await installPlugin(hit.id, hit.version, hit.registry);
    } catch (err) {
      error.value = describeError(err, `Failed to install ${hit.id}.`);
      return null;
    } finally {
      const after = new Map(installing.value);
      after.delete(hit.id);
      installing.value = after;
    }
  }

  function reset(): void {
    query.value = "";
    results.value = [];
    loading.value = false;
    error.value = null;
    notImplemented.value = false;
    installing.value = new Map();
  }

  return {
    query,
    results,
    loading,
    error,
    notImplemented,
    installing,
    search,
    install,
    reset,
  };
}
