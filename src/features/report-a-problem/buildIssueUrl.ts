import { redactSensitive } from "./redact";

export interface IssueDraft {
  title: string;
  body: string;
}

export interface BuildIssueOptions {
  repoSlug: string;
  taskId: string | null;
  scenarioId: string | null;
  scenarioTitle: string | null;
  taskStatus: string | null;
  errorText: string | null;
  recentLog: string | null;
  artifactPaths: string[];
}

const MAX_BODY_CHARS = 6500;

function clip(text: string, limit: number): string {
  if (!text) return "";
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1) + "…";
}

function trimList(items: string[], maxItems: number): string[] {
  return items.slice(0, maxItems);
}

export function buildIssueDraft(options: BuildIssueOptions): IssueDraft {
  const summary = options.errorText?.split("\n")[0]?.trim() ?? "";
  const fallbackSummary = options.scenarioTitle
    ? `Issue with scenario ${options.scenarioTitle}`
    : "AIlourOS run issue";
  const titleBase = (summary || fallbackSummary).slice(0, 120);
  const title = titleBase.startsWith("[ailouros]")
    ? titleBase
    : `[ailouros] ${titleBase}`;

  const lines: string[] = [];
  lines.push("## Context");
  if (options.taskId) lines.push(`- task_id: ${options.taskId}`);
  if (options.scenarioId) lines.push(`- scenario: ${options.scenarioId}`);
  if (options.scenarioTitle) lines.push(`- scenario_title: ${options.scenarioTitle}`);
  if (options.taskStatus) lines.push(`- task_status: ${options.taskStatus}`);
  lines.push("");

  if (options.errorText) {
    lines.push("## Error");
    lines.push("```");
    lines.push(redactSensitive(clip(options.errorText, 1500)));
    lines.push("```");
    lines.push("");
  }

  if (options.recentLog) {
    lines.push("## Recent log");
    lines.push("```");
    lines.push(redactSensitive(clip(options.recentLog, 2500)));
    lines.push("```");
    lines.push("");
  }

  if (options.artifactPaths.length) {
    lines.push("## Artifacts");
    for (const path of trimList(options.artifactPaths, 30)) {
      lines.push(`- ${path}`);
    }
    lines.push("");
  }

  lines.push("## Steps to reproduce");
  lines.push("1. ");
  lines.push("");
  lines.push("## Expected behaviour");
  lines.push("");
  lines.push("## Actual behaviour");
  lines.push("");
  lines.push(
    "_All sensitive values were locally redacted before this body was generated._",
  );

  const body = clip(lines.join("\n"), MAX_BODY_CHARS);
  return { title, body };
}

export function buildIssueUrl(options: BuildIssueOptions): string {
  const { repoSlug } = options;
  if (!repoSlug || !/^[\w.-]+\/[\w.-]+$/.test(repoSlug)) {
    return "";
  }
  const draft = buildIssueDraft(options);
  const params = new URLSearchParams();
  params.set("title", draft.title);
  params.set("body", draft.body);
  return `https://github.com/${repoSlug}/issues/new?${params.toString()}`;
}
