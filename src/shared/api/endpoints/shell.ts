import { httpGet, httpPost } from "@/shared/api/http";

export interface ShellExecResult {
  output: string;
  error?: string | null;
  returncode: number;
}

export interface SupervisedProcessDto {
  process_id: string;
  name: string;
  pid: number;
  command: string;
  is_running: boolean;
  status: "running" | "stopped";
  returncode: number | null;
  created_at: number;
}

export async function executeShell(
  command: string,
  workspaceRoot?: string,
): Promise<ShellExecResult> {
  return httpPost<ShellExecResult>("/api/shell/exec", {
    command,
    workspace_root: workspaceRoot,
  });
}

export async function listSupervisedProcesses(): Promise<{
  processes: SupervisedProcessDto[];
}> {
  return httpGet<{ processes: SupervisedProcessDto[] }>("/api/shell/processes");
}

export async function getSupervisedProcessLogs(
  processId: string,
  tail = 100,
): Promise<{ pid: string; logs: string; stdout: string; stderr: string }> {
  return httpGet<{ pid: string; logs: string; stdout: string; stderr: string }>(
    `/api/shell/processes/${encodeURIComponent(processId)}/logs?tail=${tail}`,
  );
}

export async function stopSupervisedProcess(
  processId: string,
): Promise<{ pid: string; stopped: boolean }> {
  return httpPost<{ pid: string; stopped: boolean }>(
    `/api/shell/processes/${encodeURIComponent(processId)}/stop`,
    {},
  );
}
