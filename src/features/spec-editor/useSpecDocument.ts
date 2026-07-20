import { ref, type Ref } from "vue";
import { ApiError } from "@/shared/api/http";
import { getSpecDocument, type SpecDocumentDto } from "@/shared/api/endpoints/spec";

export interface UseSpecDocumentState {
  document: Ref<SpecDocumentDto | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  notFound: Ref<boolean>;
  load: (specId: string, workspaceRoot: string) => Promise<void>;
  reset: () => void;
}

/**
 * Fetches the content of a single spec-graph node via `/v1/spec/document`.
 *
 * The spec graph is built from the workspace document store (`.swarm/docs`), so
 * node ids resolve against that store — not the `.swarm/specs` registry behind
 * `/v1/spec/show`, which 404s for these ids. This composable turns a clicked
 * node id into the document's rendered content.
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
      const dto = await getSpecDocument(root, id);
      document.value = {
        spec_id: dto.spec_id,
        title: dto.spec_id,
        status: dto.agent,
        version: dto.version ? String(dto.version) : undefined,
        body: dto.body ?? "",
      };
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
