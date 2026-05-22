type ConversationRole = "user" | "assistant" | "system" | string;

export interface ConversationMessage {
  id: string;
  task_id: string;
  role: ConversationRole;
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationHistoryResponse {
  task_id: string;
  messages: ConversationMessage[];
  shared_history_enabled?: boolean;
}
