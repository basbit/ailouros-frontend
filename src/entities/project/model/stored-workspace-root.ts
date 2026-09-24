import {
  persistenceAdapter,
  readLegacySettings,
} from "@/shared/lib/persistence-adapter";
import { LS_PROJECTS } from "@/shared/lib/swarm-ui-constants";

/**
 * Stored projects blob as read back from persistence. Deliberately looser than
 * `ProjectsData`: it may have been written by an older build, so every level
 * is optional.
 */
interface StoredProjects {
  current?: string;
  projects?: Record<string, { snap?: { workspace_root?: string } }>;
}

/**
 * Workspace root of the selected project as last persisted.
 *
 * Read by the app shell before the settings provider has booted, so it goes
 * straight to storage instead of through the projects store. Falls back to the
 * pre-projects single-settings blob.
 */
export function readStoredWorkspaceRoot(): string {
  const projects = persistenceAdapter.read(LS_PROJECTS) as StoredProjects | null;
  if (projects) {
    const currentId = projects.current ?? "";
    const projectRoot =
      projects.projects?.[currentId]?.snap?.workspace_root?.trim() ?? "";
    if (projectRoot) return projectRoot;
  }
  const legacy = readLegacySettings() as { workspace_root?: string } | null;
  return legacy?.workspace_root?.trim() ?? "";
}
