import { apiUrl } from "@/shared/api/base";

export interface ChatCompletionsBody {
  model: string;
  stream: boolean;
  messages: { role: string; content: string }[];
  agent_config: Record<string, unknown>;
  pipeline_steps: unknown[];
  workspace_root: string | null;
  project_context_file: string | null;
  workspace_write: boolean;
}

export function postChatCompletionsStream(
  body: ChatCompletionsBody,
): Promise<Response> {
  return fetch(apiUrl("/v1/chat/completions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
