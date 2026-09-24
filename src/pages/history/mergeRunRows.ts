import type { ServerRunRow } from "@/shared/api/endpoints/run-history";
import { parseTaskStatus } from "@/shared/lib/task-status";
import type { HistoryEntry } from "@/shared/store/ui";

function timestampOf(iso: string): number | null {
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? null : parsed;
}

function taskKey(taskId: string | null | undefined): string {
  return (taskId ?? "").trim();
}

function rowFromServerRun(run: ServerRunRow): HistoryEntry {
  const startedAt = timestampOf(run.createdAt);
  const finishedAt = timestampOf(run.updatedAt);
  return {
    id: run.taskId,
    at: startedAt ?? 0,
    prompt: run.prompt,
    agent_config: {},
    pipeline_steps: [...run.pipelineSteps],
    taskId: run.taskId,
    workspace_root: run.workspaceRoot || null,
    status: parseTaskStatus(run.status),
    startedAt,
    finishedAt,
    durationMs:
      startedAt !== null && finishedAt !== null ? finishedAt - startedAt : null,
  };
}

/**
 * The runs on disk merged into the runs this browser remembers.
 *
 * A run that localStorage never saw — started in another browser, in the
 * desktop app, or before the site data was cleared — becomes a row of its own.
 * For a run both sides know, the local row keeps the launch details only it has
 * (agent config, fork lineage) while the server decides the status: the local
 * copy freezes at whatever the tab last saw, so it goes stale the moment a run
 * finishes with History closed.
 */
export function mergeRunRows(
  local: readonly HistoryEntry[],
  serverRuns: readonly ServerRunRow[],
): HistoryEntry[] {
  const serverByTaskId = new Map<string, ServerRunRow>();
  for (const run of serverRuns) {
    const key = taskKey(run.taskId);
    if (key && !serverByTaskId.has(key)) serverByTaskId.set(key, run);
  }

  const seen = new Set<string>();
  const merged: HistoryEntry[] = [];
  for (const entry of local) {
    const key = taskKey(entry.taskId);
    const run = key ? serverByTaskId.get(key) : undefined;
    if (!run) {
      merged.push(entry);
      continue;
    }
    seen.add(key);
    const serverRow = rowFromServerRun(run);
    merged.push({
      ...entry,
      status: serverRow.status ?? entry.status ?? null,
      prompt: entry.prompt || serverRow.prompt,
      pipeline_steps: entry.pipeline_steps?.length
        ? entry.pipeline_steps
        : serverRow.pipeline_steps,
      workspace_root: entry.workspace_root || serverRow.workspace_root,
      startedAt: entry.startedAt ?? serverRow.startedAt,
      finishedAt: entry.finishedAt ?? serverRow.finishedAt,
      durationMs: entry.durationMs ?? serverRow.durationMs,
    });
  }

  for (const run of serverByTaskId.values()) {
    if (seen.has(taskKey(run.taskId))) continue;
    merged.push(rowFromServerRun(run));
  }

  return merged.sort((left, right) => {
    const rightAt = right.startedAt ?? right.at;
    const leftAt = left.startedAt ?? left.at;
    return rightAt - leftAt;
  });
}
