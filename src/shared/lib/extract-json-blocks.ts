export function extractJsonBlocks(text: string): unknown[] {
  if (!text) return [];
  const fence = /```json\s*([\s\S]*?)```/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null = fence.exec(text);
  while (match !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      /* ignore malformed block */
    }
    match = fence.exec(text);
  }
  return blocks;
}
