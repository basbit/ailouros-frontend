export interface ShadowWorktreeStatus {
  is_active: boolean;
  task_id: string;
  worktree_path: string | null;
  branch_name: string | null;
  has_changes: boolean;
  changed_files: string[];
}

export interface ShadowWorktreeActionResponse {
  success: boolean;
  message: string;
}
