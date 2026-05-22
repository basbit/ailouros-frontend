type SlashCommandKind = "goal";

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
