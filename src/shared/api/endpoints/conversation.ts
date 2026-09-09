import { httpDelete, httpGet, httpPatch, httpPost } from "@/shared/api/http";
import { apiUrl } from "@/shared/api/base";

export interface ConversationMessageDto {
  id: string;
  task_id: string;
  role: string;
  content: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface ConversationDto {
  task_id: string;
  messages: ConversationMessageDto[];
  shared_history_enabled: boolean;
}

export async function getConversation(
  taskId: string,
  limit = 50,
): Promise<ConversationDto> {
  const query = limit != null && limit > 0 ? `?limit=${limit}` : "";
  return httpGet<ConversationDto>(
    `/v1/conversation/${encodeURIComponent(taskId)}${query}`,
  );
}

export interface ConversationTurnDto {
  id: string;
  user_message: string;
  created_at: string;
  attachments?: Array<{ name: string; content?: string }>;
  image_attachments?: Array<{ name: string; path: string }>;
  status: "pending" | "running" | "completed" | "failed" | "blocked" | "awaiting_human";
  task_id?: string | null;
  orchestrator_decision?: Record<string, unknown> | null;
  step_progress?: Array<Record<string, unknown>>;
  assistant_message?: string;
  gate?: Record<string, unknown> | null;
  artifacts?: string[];
}

export interface ConversationThreadDto {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
  workspace_root?: string | null;
  turns: ConversationTurnDto[];
}

export interface ConversationThreadSummaryDto {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  project_id?: string | null;
  workspace_root?: string | null;
  turn_count: number;
  latest_message?: string;
}

export async function listConversationThreads(
  projectId?: string | null,
  workspaceRoot?: string | null,
  limit = 50,
): Promise<{ threads: ConversationThreadSummaryDto[] }> {
  const params = new URLSearchParams();
  if (projectId) params.set("project_id", projectId);
  if (workspaceRoot) params.set("workspace_root", workspaceRoot);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return httpGet<{ threads: ConversationThreadSummaryDto[] }>(
    `/v1/conversations${qs ? `?${qs}` : ""}`,
  );
}

export async function createConversationThread(payload: {
  title?: string;
  project_id?: string | null;
  workspace_root?: string | null;
}): Promise<{ thread: ConversationThreadDto }> {
  return httpPost<{ thread: ConversationThreadDto }>("/v1/conversations", payload);
}

export async function getConversationThread(
  threadId: string,
): Promise<{ thread: ConversationThreadDto }> {
  return httpGet<{ thread: ConversationThreadDto }>(
    `/v1/conversations/${encodeURIComponent(threadId)}`,
  );
}

export async function deleteConversationThread(
  threadId: string,
): Promise<{ ok: boolean; thread_id: string }> {
  return httpDelete<{ ok: boolean; thread_id: string }>(
    `/v1/conversations/${encodeURIComponent(threadId)}`,
  );
}

export async function appendConversationTurn(
  threadId: string,
  payload: {
    user_message: string;
    attachments?: Array<{ name: string; content?: string }>;
    image_attachments?: Array<{ name: string; path: string }>;
    task_id?: string | null;
    status?: string;
    orchestrator_decision?: Record<string, unknown> | null;
  },
): Promise<{ thread: ConversationThreadDto; turn: ConversationTurnDto }> {
  return httpPost<{ thread: ConversationThreadDto; turn: ConversationTurnDto }>(
    `/v1/conversations/${encodeURIComponent(threadId)}/turn`,
    payload,
  );
}

export async function updateConversationTurn(
  threadId: string,
  turnId: string,
  payload: {
    status?: string;
    assistant_message?: string;
    orchestrator_decision?: Record<string, unknown> | null;
    gate?: Record<string, unknown> | null;
    artifacts?: string[];
    append_progress?: Record<string, unknown>;
  },
): Promise<{ turn: ConversationTurnDto }> {
  return httpPatch<{ turn: ConversationTurnDto }>(
    `/v1/conversations/${encodeURIComponent(threadId)}/turns/${encodeURIComponent(turnId)}`,
    payload,
  );
}

/** URL for a turn's image attachment (served inline by the backend). */
export function turnAttachmentUrl(
  threadId: string,
  turnId: string,
  name: string,
): string {
  const qs = `name=${encodeURIComponent(name)}`;
  return apiUrl(
    `/v1/conversations/${encodeURIComponent(threadId)}/turns/${encodeURIComponent(turnId)}/attachment?${qs}`,
  );
}
