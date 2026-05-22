import {
  parseChatStreamEvent,
  type ChatStreamEvent,
} from "@/shared/lib/chat-stream-events";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const SSE_FRAME_SEPARATOR = "\n\n";
const SSE_DATA_LINE_PREFIX = "data:";
const SSE_DONE_SENTINEL = "[DONE]";

interface OpenAiCompatDelta {
  choices?: { delta?: { content?: string } }[];
}

function extractDeltaContent(payload: string): string {
  const parsed = JSON.parse(payload) as OpenAiCompatDelta;
  return parsed.choices?.[0]?.delta?.content ?? "";
}

function parseSseDataPayload(payload: string): ChatStreamEvent | null {
  const content = extractDeltaContent(payload);
  if (!content) return null;
  return parseChatStreamEvent(content);
}

function dispatchSseDataLine(
  line: string,
  onEvent: (event: ChatStreamEvent) => void,
): void {
  if (!line.startsWith(SSE_DATA_LINE_PREFIX)) return;
  const payload = line.slice(SSE_DATA_LINE_PREFIX.length).trim();
  if (!payload || payload === SSE_DONE_SENTINEL) return;
  let parsed: ChatStreamEvent | null;
  try {
    parsed = parseSseDataPayload(payload);
  } catch (error) {
    frontendLogger.warn("swarm-chat-stream: dropped malformed SSE data line", {
      payloadPreview: payload.slice(0, 200),
      error: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  if (parsed) onEvent(parsed);
}

function dispatchSseFrame(
  frame: string,
  onEvent: (event: ChatStreamEvent) => void,
): void {
  for (const line of frame.split("\n")) {
    dispatchSseDataLine(line, onEvent);
  }
}

function flushBufferedFrames(
  buffer: string,
  onEvent: (event: ChatStreamEvent) => void,
): string {
  let remaining = buffer;
  let separatorIndex = remaining.indexOf(SSE_FRAME_SEPARATOR);
  while (separatorIndex !== -1) {
    const frame = remaining.slice(0, separatorIndex);
    remaining = remaining.slice(separatorIndex + SSE_FRAME_SEPARATOR.length);
    dispatchSseFrame(frame, onEvent);
    separatorIndex = remaining.indexOf(SSE_FRAME_SEPARATOR);
  }
  return remaining;
}

function attachAbortSignal(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): () => void {
  const cancelReader = (): void => {
    reader.cancel().catch((error: unknown) => {
      frontendLogger.warn("swarm-chat-stream: reader cancel rejected", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  };
  if (signal.aborted) {
    cancelReader();
    return (): void => undefined;
  }
  signal.addEventListener("abort", cancelReader, { once: true });
  return (): void => signal.removeEventListener("abort", cancelReader);
}

export async function consumeSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const detachAbort = signal
    ? attachAbortSignal(reader, signal)
    : (): void => undefined;
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      buffer += decoder.decode(value, { stream: true });
      buffer = flushBufferedFrames(buffer, onEvent);
    }
  } finally {
    detachAbort();
  }
}
