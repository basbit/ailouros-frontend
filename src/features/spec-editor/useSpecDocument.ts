import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import { showSpec, type SpecDocumentDto } from "@/shared/api/endpoints/spec";

export interface UseSpecDocumentState {
  document: Ref<SpecDocumentDto | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notFound: Ref<boolean>;
  load: (specId: string, workspaceRoot: string) => Promise<void>;
  reset: () => void;
}

/**
 * Fetches the body + frontmatter of a single spec via `/v1/spec/show`.
 *
 * The spec graph emits node ids when a node is clicked; this composable turns
 * that id into the spec's actual content so the editor/viewer can render it.
 * Without it the editor only ever shows empty requirement/decision/task tables.
 */
export function useSpecDocument(): UseSpecDocumentState {
  const document = ref<SpecDocumentDto | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const notFound = ref(false);

  async function load(specId: string, workspaceRoot: string): Promise<void> {
    const id = (specId ?? "").trim();
    const root = (workspaceRoot ?? "").trim();
    if (!id || !root) {
      reset();
      return;
    }
    loading.value = true;
    error.value = null;
    notFound.value = false;
    try {
      const dto = await showSpec(root, id);
      document.value = dto.spec;
    } catch (err) {
      document.value = null;
      if (err instanceof ApiError && err.status === 404) {
        notFound.value = true;
        return;
      }
      error.value = err instanceof Error ? err.message : String(err);
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    document.value = null;
    loading.value = false;
    error.value = null;
    notFound.value = false;
  }

  return { document, loading, error, notFound, load, reset };
}
