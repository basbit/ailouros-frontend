import { apiUrl } from "@/shared/api/base";
import { ApiError, httpGet, httpPost } from "@/shared/api/http";

export interface PendingManualShellPayload {
  commands: string[];
  reason: string;
}

export interface PendingHumanResponse {
  context: string;
  pending: boolean;
  questions?: { index: number; text: string; options: string[] }[];
}

export interface PendingShellPayload {
  commands: string[];
  needs_allowlist: string[];
  already_allowed: string[];
}

export async function postHumanResumeStream(
  taskId: string,
  feedback: string,
  agentConfig?: Record<string, unknown> | null,
): Promise<Response> {
  const body: Record<string, unknown> = { feedback, stream: true };
  if (agentConfig) body.agent_config = agentConfig;
  return fetch(apiUrl(`/v1/tasks/${encodeURIComponent(taskId)}/human-resume`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postRetryStream(
  taskId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(apiUrl(`/v1/tasks/${encodeURIComponent(taskId)}/retry`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function postConfirmShell(
  taskId: string,
  approved: boolean,
): Promise<void> {
  await httpPost<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-shell`,
    { approved },
  );
}

export async function getPendingManualShell(
  taskId: string,
): Promise<PendingManualShellPayload | null> {
  try {
    return await httpGet<PendingManualShellPayload>(
      `/v1/tasks/${encodeURIComponent(taskId)}/pending-manual-shell`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function postConfirmManualShell(
  taskId: string,
  done: boolean,
): Promise<void> {
  await httpPost<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-manual-shell`,
    { done },
  );
}

export async function postConfirmHuman(
  taskId: string,
  approved: boolean,
  userInput = "",
): Promise<void> {
  await httpPost<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-human`,
    { approved, user_input: userInput },
  );
}

export async function getPendingHuman(
  taskId: string,
): Promise<PendingHumanResponse | null> {
  try {
    return await httpGet<PendingHumanResponse>(
      `/v1/tasks/${encodeURIComponent(taskId)}/pending-human`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPendingShell(
  taskId: string,
): Promise<PendingShellPayload | null> {
  try {
    return await httpGet<PendingShellPayload>(
      `/v1/tasks/${encodeURIComponent(taskId)}/pending-shell`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
