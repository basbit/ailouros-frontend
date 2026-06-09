export interface PresentArtefact {
  readonly filename: string;
  readonly contentLength: number;
}

export interface ArtefactCatalogueReport {
  readonly scenario: string;
  readonly required: readonly string[];
  readonly presentByCategory: Readonly<Record<string, readonly PresentArtefact[]>>;
  readonly missing: readonly string[];
  readonly empty: readonly string[];
  readonly uncategorised: readonly string[];
  readonly isComplete: boolean;
}

interface RawPresentArtefact {
  filename?: unknown;
  content_length?: unknown;
}

interface RawReport {
  scenario?: unknown;
  required?: unknown;
  present_by_category?: unknown;
  missing?: unknown;
  empty?: unknown;
  uncategorised?: unknown;
  is_complete?: unknown;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function parsePresentArtefact(raw: unknown): PresentArtefact | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawPresentArtefact;
  const filename = readString(candidate.filename);
  if (!filename) return null;
  const size = candidate.content_length;
  return {
    filename,
    contentLength: typeof size === "number" && Number.isFinite(size) ? size : 0,
  };
}

function parsePresentByCategory(raw: unknown): Record<string, PresentArtefact[]> {
  if (!raw || typeof raw !== "object") return {};
  const grouped: Record<string, PresentArtefact[]> = {};
  for (const [category, entries] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(entries)) continue;
    grouped[category] = entries
      .map(parsePresentArtefact)
      .filter((entry): entry is PresentArtefact => entry !== null);
  }
  return grouped;
}

export function parseArtefactReportPayload(
  raw: unknown,
): ArtefactCatalogueReport | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawReport;
  const scenario = readString(candidate.scenario);
  if (!scenario) return null;
  return {
    scenario,
    required: readStringArray(candidate.required),
    presentByCategory: parsePresentByCategory(candidate.present_by_category),
    missing: readStringArray(candidate.missing),
    empty: readStringArray(candidate.empty),
    uncategorised: readStringArray(candidate.uncategorised),
    isComplete: candidate.is_complete !== false,
  };
}
