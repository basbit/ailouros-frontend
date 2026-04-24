export interface ScanResult {
  detected_stack: string[];
  suggested_context_mode: string;
  mcp_available: boolean;
  git_available: boolean;
  workspace_has_git_repo: boolean;
  context_file_exists: boolean;
  proposed_config_preview: string;
}

export interface MCPServerSpec {
  name: string;
  transport: string;
  command: string;
  args: string[];
  enabled: boolean;
  reason: string;
  package: string;
  scope_dirs?: string[];
}

export interface PreconfigResult {
  mcp_recommendations: MCPServerSpec[];
  context_mode: string;
  priority_paths: string[];
  base_model: string;
}

export interface ModelAssignment {
  role: string;
  model_id: string;
  provider: string;
  reason: string;
  remote_profile?: string;
}

export interface PreflightInfo {
  status: "pending" | "ok" | "failed";
  latency?: number;
  tool_count?: number;
  error?: string;
}

export interface PreflightRecommendation {
  name: string;
  recommended: boolean;
  available?: boolean;
  enabled?: boolean;
  reason: string;
}
