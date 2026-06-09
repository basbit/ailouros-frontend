import { ApiError, httpGet, httpPatch } from "@/shared/api/http";

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
