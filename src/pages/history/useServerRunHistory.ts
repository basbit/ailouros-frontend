import { onActivated, onMounted, ref } from "vue";
import { listServerRuns, type ServerRunRow } from "@/shared/api/endpoints/run-history";
import { useProjectsStore } from "@/entities/project";

export const SERVER_RUN_LIMIT = 200;

/**
 * The runs the backend has on disk for the current project.
 *
 * A project with no `workspace_root` configured has nothing to scope runs by,
 * so the listing is unfiltered rather than silently empty. History lives inside
 * `<keep-alive>`, so the list is refreshed on every activation after the first
 * render, which `onMounted` already covers.
 */
export function useServerRunHistory() {
  const projectsStore = useProjectsStore();
  const serverRuns = ref<ServerRunRow[]>([]);
  const loading = ref(false);
  const loadError = ref("");
  let inFlight = 0;

  async function reload(): Promise<void> {
    const request = ++inFlight;
    loading.value = true;
    try {
      const listing = await listServerRuns({
        limit: SERVER_RUN_LIMIT,
        workspaceRoot: projectsStore.currentProject?.snap.workspace_root ?? "",
      });
      if (request !== inFlight) return;
      serverRuns.value = [...listing.runs];
      loadError.value = "";
    } catch (error) {
      if (request !== inFlight) return;
      serverRuns.value = [];
      loadError.value = error instanceof Error ? error.message : String(error);
    } finally {
      if (request === inFlight) loading.value = false;
    }
  }

  let mountedThisRender = false;
  onMounted(() => {
    mountedThisRender = true;
    void reload();
  });
  onActivated(() => {
    if (mountedThisRender) {
      mountedThisRender = false;
      return;
    }
    void reload();
  });

  return { serverRuns, loading, loadError, reload };
}
