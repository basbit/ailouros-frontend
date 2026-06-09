type SlashCommandKind = "goal" | "dispatch" | "quick";

export interface SlashCommand {
  key: SlashCommandKind;
  trigger: string;
  description: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    key: "goal",
    trigger: "/goal",
    description:
      "Create a persistent goal that spawns tasks until success criteria are met.",
  },
  {
    key: "dispatch",
    trigger: "/dispatch",
    description: "Route a task hint through the skill dispatcher (no run started).",
  },
  {
    key: "quick",
    trigger: "/quick",
    description:
      "Evaluate a change as a quick-fix candidate: `description | file1,file2 | loc`.",
  },
];

interface ParsedGoalSchedule {
  mode: "cron" | "natural";
  cron?: string;
  naturalLanguage?: string;
}

export interface ParsedGoalCommand {
  kind: "goal";
  title: string;
  successCriteria: string[];
  description: string;
  schedule: ParsedGoalSchedule | null;
}

export function tryParseGoalCommand(raw: string): ParsedGoalCommand | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/goal")) return null;
  const rest = trimmed.slice("/goal".length).trim();
  if (!rest) return null;
  const lines = rest.split(/\r?\n/);
  const title = (lines[0] ?? "").trim();
  if (!title) return null;
  const criteria: string[] = [];
  let description = "";
  const descriptionBuffer: string[] = [];
  let schedule: ParsedGoalSchedule | null = null;
  let mode: "criteria" | "description" = "criteria";
  for (const line of lines.slice(1)) {
    const stripped = line.trim();
    if (!stripped) continue;
    if (stripped.toLowerCase().startsWith("description:")) {
      mode = "description";
      descriptionBuffer.push(stripped.slice("description:".length).trim());
      continue;
    }
    if (stripped.toLowerCase().startsWith("schedule:")) {
      schedule = parseScheduleLine(stripped.slice("schedule:".length).trim());
      continue;
    }
    if (mode === "description") {
      descriptionBuffer.push(stripped);
      continue;
    }
    const bullet = stripped.replace(/^[-*]\s*/, "").trim();
    if (bullet) criteria.push(bullet);
  }
  description = descriptionBuffer.join("\n").trim();
  return { kind: "goal", title, successCriteria: criteria, description, schedule };
}

type DispatchOrQuickKind = "dispatch" | "quick";

export interface DispatchOrQuickIntent {
  readonly kind: DispatchOrQuickKind;
  readonly payload: string;
}

const _DISPATCH_OR_QUICK_PATTERN = /^\/(dispatch|quick)\b\s*(.*)$/i;

export function tryParseDispatchOrQuick(raw: string): DispatchOrQuickIntent | null {
  const match = _DISPATCH_OR_QUICK_PATTERN.exec(raw.trim());
  if (!match) return null;
  return {
    kind: match[1].toLowerCase() as DispatchOrQuickKind,
    payload: match[2].trim(),
  };
}

export interface QuickFixPayload {
  readonly description: string;
  readonly targetFiles: readonly string[];
  readonly estimatedLoc: number;
}

export function parseQuickFixPayload(payload: string): QuickFixPayload {
  const segments = payload.split("|").map((entry) => entry.trim());
  const description = segments[0] ?? "";
  const filesRaw = segments[1] ?? "";
  const locRaw = segments[2] ?? "0";
  const targetFiles = filesRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const parsedLoc = Number.parseInt(locRaw, 10);
  return {
    description,
    targetFiles,
    estimatedLoc: Number.isFinite(parsedLoc) && parsedLoc >= 0 ? parsedLoc : 0,
  };
}

function parseScheduleLine(raw: string): ParsedGoalSchedule | null {
  if (!raw) return null;
  const cronMatch = raw.match(/^cron\s+(.+)$/i);
  if (cronMatch) {
    const cron = (cronMatch[1] ?? "").trim();
    if (cron.split(/\s+/).length === 5) {
      return { mode: "cron", cron };
    }
    return null;
  }
  return { mode: "natural", naturalLanguage: raw };
}
