/** Where a curated setting's live value comes from, as the server reports it. */
export type SettingSource = "ui" | "env" | "default";

const SOURCES: ReadonlySet<string> = new Set(["ui", "env", "default"]);

export function readFieldSources(response: object): Record<string, SettingSource> {
  const raw = (response as { field_sources?: unknown }).field_sources;
  if (!raw || typeof raw !== "object") return {};
  const sources: Record<string, SettingSource> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string" && SOURCES.has(value)) {
      sources[key] = value as SettingSource;
    }
  }
  return sources;
}
