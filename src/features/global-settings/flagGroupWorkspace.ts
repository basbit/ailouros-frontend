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
      kind: "enum",
      field: "swarm_exec_backend",
      envName: "SWARM_EXEC_BACKEND",
      options: [
        { value: "", i18nSuffix: "default" },
        { value: "host", i18nSuffix: "host" },
        { value: "docker", i18nSuffix: "docker" },
        { value: "container", i18nSuffix: "container" },
      ],
    },
    {
      kind: "string",
      field: "swarm_shell_allowlist",
      envName: "SWARM_SHELL_ALLOWLIST",
      placeholder:
        "pwd,ls,find,cat,head,tail,wc,file,stat,echo,which,env,npm,npx,yarn,pnpm,corepack,bun,node,pip,pip3,python,python3,uv,make,cargo,rustc,go,composer,php,dotnet,gradle,mvn,pytest,eslint,prettier,tsc,jest,vitest,ruff,flake8",
    },
    {
      kind: "boolean",
      field: "swarm_goal_scheduler_enabled",
      envName: "SWARM_GOAL_SCHEDULER_ENABLED",
    },
    {
      kind: "boolean",
      field: "swarm_dev_shell_use_sandbox_resolver",
      envName: "SWARM_DEV_SHELL_USE_SANDBOX_RESOLVER",
    },
    {
      kind: "boolean",
      field: "swarm_block_unjustified_full_rewrite_before_apply",
      envName: "SWARM_BLOCK_UNJUSTIFIED_FULL_REWRITE_BEFORE_APPLY",
    },
  ],
};
