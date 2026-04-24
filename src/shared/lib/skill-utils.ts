export function parseSkillIds(s: string): string[] {
  if (!s || !s.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of s.split(/[,;\s]+/)) {
    const x = part
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/, "")
      .slice(0, 64);
    if (x && !seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}
