type RedTeamCategory = "prompt_injection" | "off_topic" | "citation_required";

interface RedTeamProbeSummary {
  readonly probeId: string;
  readonly category: RedTeamCategory;
  readonly inputText: string;
  readonly description: string;
}

export interface RedTeamCorpus {
  readonly count: number;
  readonly probes: readonly RedTeamProbeSummary[];
}

interface RawProbe {
  probe_id?: unknown;
  category?: unknown;
  input_text?: unknown;
  description?: unknown;
}

interface RawCorpus {
  count?: unknown;
  probes?: unknown;
}

const KNOWN_CATEGORIES: ReadonlySet<RedTeamCategory> = new Set([
  "prompt_injection",
  "off_topic",
  "citation_required",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readCategory(value: unknown): RedTeamCategory | null {
  const candidate = readString(value) as RedTeamCategory;
  return KNOWN_CATEGORIES.has(candidate) ? candidate : null;
}

function readNonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.trunc(value))
    : 0;
}

function parseProbe(raw: unknown): RedTeamProbeSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawProbe;
  const probeId = readString(candidate.probe_id).trim();
  if (!probeId) return null;
  const category = readCategory(candidate.category);
  if (!category) return null;
  return {
    probeId,
    category,
    inputText: readString(candidate.input_text),
    description: readString(candidate.description),
  };
}

export function parseRedTeamCorpusPayload(raw: unknown): RedTeamCorpus | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawCorpus;
  const probes = Array.isArray(candidate.probes)
    ? candidate.probes
        .map(parseProbe)
        .filter((entry): entry is RedTeamProbeSummary => entry !== null)
    : [];
  return {
    count: readNonNegativeInt(candidate.count),
    probes,
  };
}
