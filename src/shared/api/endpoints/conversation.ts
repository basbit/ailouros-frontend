import { httpGet } from "@/shared/api/http";

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
