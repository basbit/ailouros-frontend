interface DocumentationSourceEntry {
  url: string;
  title?: string;
  note?: string;
}

const DOCUMENTATION_SOURCE_SEPARATOR = " | ";
const COMMENT_LINE_PREFIX = "#";

function isHttpOrHttpsUrl(candidate: string): boolean {
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function splitTitleAndNote(rest: string): { title: string; note: string } {
  const firstSeparatorIndex = rest.indexOf(DOCUMENTATION_SOURCE_SEPARATOR);
  if (firstSeparatorIndex < 0) return { title: rest, note: "" };
  return {
    title: rest.slice(0, firstSeparatorIndex).trim(),
    note: rest
      .slice(firstSeparatorIndex + DOCUMENTATION_SOURCE_SEPARATOR.length)
      .trim(),
  };
}

function parseDocumentationSourceLine(line: string): DocumentationSourceEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.charAt(0) === COMMENT_LINE_PREFIX) return null;
  const lastSeparatorIndex = trimmed.lastIndexOf(DOCUMENTATION_SOURCE_SEPARATOR);
  let url = trimmed;
  let title = "";
  let note = "";
  if (lastSeparatorIndex >= 0) {
    url = trimmed
      .slice(lastSeparatorIndex + DOCUMENTATION_SOURCE_SEPARATOR.length)
      .trim();
    const rest = trimmed.slice(0, lastSeparatorIndex).trim();
    ({ title, note } = splitTitleAndNote(rest));
  }
  if (!isHttpOrHttpsUrl(url)) return null;
  const entry: DocumentationSourceEntry = { url };
  if (title) entry.title = title;
  if (note) entry.note = note;
  return entry;
}

export function parseDocumentationSourceLines(
  text: string,
): DocumentationSourceEntry[] {
  const lines = (text ?? "").replace(/\r/g, "").split("\n");
  const entries: DocumentationSourceEntry[] = [];
  for (const rawLine of lines) {
    const entry = parseDocumentationSourceLine(rawLine);
    if (entry) entries.push(entry);
  }
  return entries;
}
