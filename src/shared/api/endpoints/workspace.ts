import { ApiError, httpGet, httpPatch, httpPost } from "@/shared/api/http";

export interface WorkspaceFilePayload {
  path: string;
  content: string;
}

export interface WorkspaceDiffPayload {
  diff_text?: string;
  files_changed?: string[];
  stats?: { added?: number; removed?: number; files?: number };
  source?: string;
}

export interface ApproveWithEditsResponse {
  ok: boolean;
  path: string;
  gate_approved: boolean;
}

export interface ClarifyQuestionDto {
  index: number;
  text: string;
  options: string[];
}

export interface WorkspaceFilesPayload {
  files?: string[];
  error?: string;
}

export async function getWorkspaceFile(
  taskId: string,
  path: string,
): Promise<WorkspaceFilePayload> {
  return httpGet<WorkspaceFilePayload>(
    `/v1/tasks/${encodeURIComponent(taskId)}/workspace-file?path=${encodeURIComponent(path)}`,
  );
}

export async function patchWorkspaceFile(
  taskId: string,
  path: string,
  content: string,
): Promise<void> {
  await httpPatch<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/workspace-file`,
    { path, content },
  );
}

export async function approveWithEdits(
  taskId: string,
  path: string,
  content: string,
  feedback = "Approved with operator edits",
): Promise<ApproveWithEditsResponse> {
  return httpPost<ApproveWithEditsResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/approve-with-edits`,
    { path, content, feedback },
  );
}

export async function getWorkspaceDiff(taskId: string): Promise<WorkspaceDiffPayload> {
  return httpGet<WorkspaceDiffPayload>(
    `/v1/tasks/${encodeURIComponent(taskId)}/workspace-diff`,
  );
}

export async function getClarifyQuestions(
  taskId: string,
): Promise<{ questions?: ClarifyQuestionDto[] }> {
  return httpGet<{ questions?: ClarifyQuestionDto[] }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/clarify-questions`,
  );
}

export async function listWorkspaceFiles(
  workspaceRoot: string,
): Promise<WorkspaceFilesPayload> {
  return httpGet<WorkspaceFilesPayload>(
    `/v1/workspace/files?workspace_root=${encodeURIComponent(workspaceRoot)}`,
  );
}

export async function tryGetWorkspaceFile(
  taskId: string,
  path: string,
): Promise<WorkspaceFilePayload | null> {
  try {
    return await getWorkspaceFile(taskId, path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

interface GitCommitDto {
  sha: string;
  message: string;
  author: string;
  time_ago: string;
}

export interface GitStatusPayload {
  is_git: boolean;
  branch?: string | null;
  is_worktree?: boolean;
  head_sha?: string | null;
  clean?: boolean;
  staged_count?: number;
  unstaged_count?: number;
  insertions?: number;
  deletions?: number;
  files_changed?: number;
  recent_commits?: GitCommitDto[];
}

export async function getGitStatus(params?: {
  workspaceRoot?: string | null;
  taskId?: string | null;
}): Promise<GitStatusPayload> {
  const query = new URLSearchParams();
  if (params?.workspaceRoot) query.set("workspace_root", params.workspaceRoot);
  if (params?.taskId) query.set("task_id", params.taskId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  return httpGet<GitStatusPayload>(`/v1/workspace/git-status${qs}`);
}
