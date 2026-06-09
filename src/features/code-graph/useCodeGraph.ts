import { ref } from "vue";

import { getCodeGraph } from "@/shared/api/endpoints/codegraph";
import type { CodeGraphResponse } from "@/shared/model/code-graph-types";

export function useCodeGraph() {
  const data = ref<CodeGraphResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(workspaceRoot: string): Promise<void> {
    const root = (workspaceRoot ?? "").trim();
    if (!root) {
      error.value = "no workspace selected";
      data.value = null;
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      data.value = await getCodeGraph(root);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      data.value = null;
    } finally {
      loading.value = false;
    }
  }

  return { data, loading, error, load };
}
