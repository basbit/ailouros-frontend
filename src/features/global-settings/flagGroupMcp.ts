import type { FeatureFlagGroup } from "./featureFlagGroups";

export const FLAG_GROUP_MCP: FeatureFlagGroup = {
  id: "mcp",
  fields: [
    { kind: "boolean", field: "swarm_mcp_auto", envName: "SWARM_MCP_AUTO" },
    { kind: "boolean", field: "swarm_fetch_page", envName: "SWARM_FETCH_PAGE" },
    { kind: "boolean", field: "swarm_git_mcp", envName: "SWARM_GIT_MCP" },
    { kind: "boolean", field: "swarm_github_mcp", envName: "SWARM_GITHUB_MCP" },
    { kind: "boolean", field: "swarm_context7", envName: "SWARM_CONTEXT7" },
    { kind: "boolean", field: "swarm_mcp_cache", envName: "SWARM_MCP_CACHE" },
    { kind: "boolean", field: "swarm_memory_tools", envName: "SWARM_MEMORY_TOOLS" },
    { kind: "boolean", field: "swarm_wiki_tools", envName: "SWARM_WIKI_TOOLS" },
    {
      kind: "boolean",
      field: "swarm_vision_enabled",
      envName: "SWARM_VISION_ENABLED",
    },
  ],
};
