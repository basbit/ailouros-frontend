/**
 * Conversation history types for the frontend skeleton.
 *
 * Mirrors ``ConversationMessage`` in
 * ``backend/App/integrations/infrastructure/conversation_store.py``. Once an
 * entity for shared chat messages exists, these can move under
 * ``src/entities/conversation``.
 */

export type ConversationRole = "user" | "assistant" | "system" | string;

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
