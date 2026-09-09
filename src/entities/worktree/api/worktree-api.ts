import { httpGet, httpPost } from "@/shared/api/http";
import type {
  ShadowWorktreeActionResponse,
  ShadowWorktreeStatus,
} from "../model/types";

export async function getWorktreeStatus(
  workspaceRoot: string,
  taskId: string,
): Promise<ShadowWorktreeStatus> {
  const parameters = new URLSearchParams({
    workspace_root: workspaceRoot,
    task_id: taskId,
  });
  return httpGet<ShadowWorktreeStatus>(
    `/v1/workspace/worktree/status?${parameters.toString()}`,
  );
}

export async function applyWorktree(
  workspaceRoot: string,
  taskId: string,
  commitMessage?: string,
): Promise<ShadowWorktreeActionResponse> {
  return httpPost<ShadowWorktreeActionResponse>("/v1/workspace/worktree/apply", {
    workspace_root: workspaceRoot,
    task_id: taskId,
    commit_message: commitMessage,
  });
}

export async function discardWorktree(
  workspaceRoot: string,
  taskId: string,
): Promise<ShadowWorktreeActionResponse> {
  return httpPost<ShadowWorktreeActionResponse>("/v1/workspace/worktree/discard", {
    workspace_root: workspaceRoot,
    task_id: taskId,
  });
}
