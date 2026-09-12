import type { TextAttachment } from "@/entities/project";

/** Text attachments only, for now: the chat path sends file content inline.
 *
 * `File.text()` never throws on binary — it decodes bytes as UTF-8 and
 * substitutes U+FFFD. Attaching a screenshot therefore used to put mojibake in
 * the prompt with nothing to show for it, so binary has to be detected and
 * refused out loud rather than caught.
 */
const NUL = "\u0000";
const REPLACEMENT = "\uFFFD";
const BINARY_RATIO_LIMIT = 0.02;

export function looksBinary(text: string): boolean {
  if (!text) return false;
  if (text.includes(NUL)) return true;
  let replacements = 0;
  for (const char of text) {
    if (char === REPLACEMENT) replacements += 1;
  }
  return replacements / text.length > BINARY_RATIO_LIMIT;
}

export interface AttachmentReadResult {
  accepted: TextAttachment[];
  rejected: { name: string; reason: "binary" | "unreadable" | "duplicate" | "too_large" }[];
}

export async function readAttachments(
  files: File[],
  existing: TextAttachment[],
  maxChars?: number,
): Promise<AttachmentReadResult> {
  const accepted: TextAttachment[] = [];
  const rejected: AttachmentReadResult["rejected"] = [];
  const taken = new Set(existing.map((att) => att.name));

  for (const file of files) {
    if (taken.has(file.name)) {
      rejected.push({ name: file.name, reason: "duplicate" });
      continue;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      rejected.push({ name: file.name, reason: "unreadable" });
      continue;
    }
    if (looksBinary(text)) {
      rejected.push({ name: file.name, reason: "binary" });
      continue;
    }
    // Refuse here rather than let the chat endpoint truncate past
    // SWARM_ATTACHMENT_MAX_CHARS with a marker the user never sees.
    if (maxChars !== undefined && maxChars > 0 && text.length > maxChars) {
      rejected.push({ name: file.name, reason: "too_large" });
      continue;
    }
    taken.add(file.name);
    accepted.push({ name: file.name, content: text });
  }
  return { accepted, rejected };
}
