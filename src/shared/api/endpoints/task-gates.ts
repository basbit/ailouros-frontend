import { apiUrl } from "@/shared/api/base";
import { ApiError, fetchJson } from "@/shared/api/client";

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
): Promise<Response> {
  return fetch(apiUrl(`/v1/tasks/${encodeURIComponent(taskId)}/human-resume`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feedback, stream: true }),
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
  await fetchJson<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-shell`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    },
  );
}

export async function getPendingManualShell(
  taskId: string,
): Promise<PendingManualShellPayload | null> {
  try {
    return await fetchJson<PendingManualShellPayload>(
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
  await fetchJson<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-manual-shell`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    },
  );
}

export async function postConfirmHuman(
  taskId: string,
  approved: boolean,
  userInput = "",
): Promise<void> {
  await fetchJson<{ ok: boolean }>(
    `/v1/tasks/${encodeURIComponent(taskId)}/confirm-human`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, user_input: userInput }),
    },
  );
}

export async function getPendingHuman(
  taskId: string,
): Promise<PendingHumanResponse | null> {
  try {
    return await fetchJson<PendingHumanResponse>(
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
    return await fetchJson<PendingShellPayload>(
      `/v1/tasks/${encodeURIComponent(taskId)}/pending-shell`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
