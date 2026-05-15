import { httpGet } from "@/shared/api/http";

export type ActivityChannel = "mcp_calls" | "web_searches" | "qdrant_ops" | "rag_hits";

export interface ActivityEntry {
  ts: string;
  channel: string;
  task_id: string;
  step?: string;
  [key: string]: unknown;
}

export interface ActivityTailResponse {
  task_id: string;
  channel: ActivityChannel;
  limit: number;
  count: number;
  entries: ActivityEntry[];
}

export interface ActivityChannelsResponse {
  task_id: string;
  channels: ActivityChannel[];
}

export async function listActivityChannels(
  taskId: string,
  signal?: AbortSignal,
): Promise<ActivityChannelsResponse> {
  return httpGet<ActivityChannelsResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/activity`,
    { signal },
  );
}

export async function getActivityTail(
  taskId: string,
  channel: ActivityChannel,
  limit = 200,
  signal?: AbortSignal,
): Promise<ActivityTailResponse> {
  return httpGet<ActivityTailResponse>(
    `/v1/tasks/${encodeURIComponent(taskId)}/activity/${channel}?limit=${limit}`,
    { signal },
  );
}
