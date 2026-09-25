/** A setting autoresearch needs, and where it lives in Settings. */
export type AutoresearchPrerequisite = "write" | "exec" | "allowlist";

export const PREREQUISITE_FIELD: Record<AutoresearchPrerequisite, string> = {
  write: "swarm_allow_workspace_write",
  exec: "swarm_allow_command_exec",
  allowlist: "swarm_shell_allowlist",
};

const REFUSAL_MARKERS: ReadonlyArray<[AutoresearchPrerequisite, string]> = [
  ["write", "workspace writes are disabled"],
  ["exec", "command execution is disabled"],
  ["allowlist", "not in allowlist"],
];

/** The prerequisites a start refusal from the server names. */
export function prerequisitesInRefusal(message: string): AutoresearchPrerequisite[] {
  const text = message.toLowerCase();
  return REFUSAL_MARKERS.filter(([, marker]) => text.includes(marker)).map(([key]) => key);
}

const PREFLIGHT_PREFIX = "autoresearch preflight failed: ";

/**
 * The refusal minus the problems a prerequisite hint already explains. The
 * server joins preflight problems with "; ", so other problems stay visible.
 */
export function refusalBeyondPrerequisites(message: string): string {
  const body = message.startsWith(PREFLIGHT_PREFIX)
    ? message.slice(PREFLIGHT_PREFIX.length)
    : message;
  const remaining = body
    .split("; ")
    .filter((problem) => problem && prerequisitesInRefusal(problem).length === 0);
  if (!remaining.length) return "";
  if (remaining.length === body.split("; ").length) return message;
  return PREFLIGHT_PREFIX + remaining.join("; ");
}

export interface PrerequisiteSettings {
  swarm_allow_workspace_write: boolean;
  swarm_allow_command_exec: boolean;
}

/**
 * What is missing before a session can work: the switches that are off now,
 * plus whatever the last refusal named. A metric command needs `exec`; a
 * prompt-eval session measures in-process and does not.
 */
export function missingPrerequisites(
  settings: PrerequisiteSettings,
  refusal: string,
  needsCommands: boolean,
): AutoresearchPrerequisite[] {
  const missing = new Set<AutoresearchPrerequisite>(prerequisitesInRefusal(refusal));
  if (!settings.swarm_allow_workspace_write) missing.add("write");
  if (needsCommands && !settings.swarm_allow_command_exec) missing.add("exec");
  return (["write", "exec", "allowlist"] as const).filter((key) => missing.has(key));
}
