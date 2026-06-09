import { ref } from "vue";

import { getCodeGraphContext } from "@/shared/api/endpoints/codegraph";
import type { CodeGraphContext } from "@/shared/model/code-graph-types";

export function useCodeGraphContext() {
  const context = ref<CodeGraphContext | null>(null);
  const selectedId = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function select(workspaceRoot: string, nodeId: string): Promise<void> {
    const root = (workspaceRoot ?? "").trim();
    const id = (nodeId ?? "").trim();
    if (!root || !id) return;
    selectedId.value = id;
    loading.value = true;
    error.value = null;
    try {
      context.value = await getCodeGraphContext(root, id);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      context.value = null;
    } finally {
      loading.value = false;
    }
  }

  function clear(): void {
    selectedId.value = null;
    context.value = null;
    error.value = null;
  }

  return { context, selectedId, loading, error, select, clear };
}
