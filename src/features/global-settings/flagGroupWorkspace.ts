import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_WORKSPACE: FeatureFlagGroup = {
  id: "workspace",
  fields: [
    {
      kind: "boolean",
      field: "swarm_workspace_snapshots",
      envName: "SWARM_WORKSPACE_SNAPSHOTS",
    },
    {
      kind: "boolean",
      field: "swarm_allow_workspace_write",
      envName: "SWARM_ALLOW_WORKSPACE_WRITE",
    },
    {
      kind: "boolean",
      field: "swarm_allow_command_exec",
      envName: "SWARM_ALLOW_COMMAND_EXEC",
    },
    {
      kind: "boolean",
      field: "swarm_goal_scheduler_enabled",
      envName: "SWARM_GOAL_SCHEDULER_ENABLED",
    },
  ],
};
