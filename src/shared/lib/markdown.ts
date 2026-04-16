/**
 * Markdown rendering helpers.
 *
 * `unwrapMarkdownFence` — strip an outer ```markdown / ```md fence that
 * some agents wrap their whole output in. Without this, `marked.parse`
 * renders the fence as a <pre><code> block and the user sees raw
 * markdown source instead of formatted HTML (bug aec02899).
 *
 * The unwrap is **intentionally strict**:
 *   * only applies when the ENTIRE message (modulo whitespace) is a
 *     single ```markdown|```md block;
 *   * mid-message code blocks in prose are left untouched;
 *   * fences with any other language tag (`python`, `json`, …) are
 *     never touched.
 *
 * This matches review-rules §2: no silent content rewriting — we only
 * unwrap what is unambiguously an agent-style fence wrapper.
 */

// Capture: optional leading whitespace, opening fence, body, closing fence,
// optional trailing whitespace. `\s*$` at the end with `s` flag matches
// through newlines.
const _WHOLE_MESSAGE_FENCE_RE = /^\s*```(?:markdown|md)\s*\n([\s\S]*?)\n```\s*$/i;

export function unwrapMarkdownFence(raw: string): string {
  if (!raw) return raw;
  const match = raw.match(_WHOLE_MESSAGE_FENCE_RE);
  if (!match) return raw;
  return match[1];
}
