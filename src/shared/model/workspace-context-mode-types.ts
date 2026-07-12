// Canonical option set for `agent_config.swarm.workspace_context_mode`.
// Must stay in sync with the backend's VALID_WORKSPACE_CONTEXT_MODES /
// resolve_workspace_context_mode (app/backend/App/workspace/infrastructure/workspace_io.py).
// `post_analysis_compact` is a backend-valid string but has no distinct
// snapshot-building branch there, so it is intentionally not offered here.
export const WORKSPACE_CONTEXT_MODES = [
  "full",
  "index_only",
  "priority_paths",
  "retrieve",
  "tools_only",
] as const;

export type WorkspaceContextMode = (typeof WORKSPACE_CONTEXT_MODES)[number];

export const WORKSPACE_CONTEXT_MODE_DEFAULT: WorkspaceContextMode = "retrieve";
