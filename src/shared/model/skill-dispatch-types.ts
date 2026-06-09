type SkillDispatcherMode = "off" | "heuristic" | "llm";

export interface SkillDispatchDecision {
  readonly skillId: string;
  readonly reason: string;
  readonly dispatcher: string;
  readonly mode: SkillDispatcherMode;
  readonly candidates: readonly string[];
}

interface RawDecision {
  skill_id?: unknown;
  reason?: unknown;
  dispatcher?: unknown;
  mode?: unknown;
  candidates?: unknown;
}

const KNOWN_MODES: ReadonlySet<SkillDispatcherMode> = new Set([
  "off",
  "heuristic",
  "llm",
]);

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readMode(value: unknown): SkillDispatcherMode {
  const candidate = readString(value) as SkillDispatcherMode;
  return KNOWN_MODES.has(candidate) ? candidate : "off";
}

function readStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  const entries: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.length > 0) entries.push(item);
  }
  return entries;
}

export function parseSkillDispatchPayload(raw: unknown): SkillDispatchDecision | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as RawDecision;
  const skillId = readString(candidate.skill_id).trim();
  if (!skillId) return null;
  return {
    skillId,
    reason: readString(candidate.reason),
    dispatcher: readString(candidate.dispatcher),
    mode: readMode(candidate.mode),
    candidates: readStringList(candidate.candidates),
  };
}
