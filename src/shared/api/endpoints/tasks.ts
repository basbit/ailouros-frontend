import { apiUrl } from "@/shared/api/base";
import { fetchJson } from "@/shared/api/client";

export interface PendingShellResponse {
  commands?: string[];
}

export async function getPendingShell(taskId: string): Promise<PendingShellResponse> {
  return fetchJson<PendingShellResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/pending-shell`,
  );
}

export async function postConfirmShell(
  taskId: string,
  approved: boolean,
): Promise<void> {
  await fetchJson<unknown>(`/v1/tasks/${encodeURIComponent(taskId)}/confirm-shell`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
}

export async function postHumanResume(
  taskId: string,
  feedback: string,
): Promise<Response> {
  return fetch(apiUrl(`/v1/tasks/${encodeURIComponent(taskId)}/human-resume`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, stream: true }),
  });
}

export interface RetryBody {
  stream: boolean;
  agent_config: Record<string, unknown>;
  from_step?: string;
}

export async function postTaskRetry(
  taskId: string,
  body: RetryBody,
): Promise<Response> {
  return fetch(apiUrl(`/v1/tasks/${encodeURIComponent(taskId)}/retry`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
