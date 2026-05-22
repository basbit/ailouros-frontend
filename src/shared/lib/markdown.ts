// Bug aec02899: unwrap only when ENTIRE message is one ```markdown|md``` block.
// Mid-message fences and other language tags are left untouched.
const _WHOLE_MESSAGE_FENCE_RE = /^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n```\s*$/i;

export function unwrapMarkdownFence(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(_WHOLE_MESSAGE_FENCE_RE);
  if (!match) return raw;
  return match[1];
}
