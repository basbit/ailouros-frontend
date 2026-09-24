import { describe, expect, it } from "vitest";
import type { ServerRunRow } from "@/shared/api/endpoints/run-history";
import type { HistoryEntry } from "@/shared/store/ui";
import { mergeRunRows } from "./mergeRunRows";

function serverRun(overrides: Partial<ServerRunRow> = {}): ServerRunRow {
  return {
    taskId: "server-run",
    createdAt: "2026-09-16T10:00:00.000Z",
    updatedAt: "2026-09-16T10:04:00.000Z",
    prompt: "a run this browser never saw",
    promptTruncated: false,
    scenarioId: "fix_bug",
    scenarioTitle: "Fix a bug",
    status: "completed",
    pipelineSteps: ["dev", "qa"],
    workspaceRoot: "/tmp/project-a",
    hasPipelineSnapshot: true,
    ...overrides,
  };
}

function localEntry(overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id: "local-id",
    at: Date.parse("2026-09-16T09:00:00.000Z"),
    prompt: "a run this browser started",
    agent_config: { scenario: "fix_bug" },
    pipeline_steps: ["dev"],
    taskId: "local-run",
    status: "completed",
    ...overrides,
  };
}

describe("mergeRunRows", () => {
  it("shows a server run that localStorage never saw", () => {
    const merged = mergeRunRows([], [serverRun()]);

    expect(merged).toHaveLength(1);
    expect(merged[0].taskId).toBe("server-run");
    expect(merged[0].id).toBe("server-run");
    expect(merged[0].prompt).toBe("a run this browser never saw");
    expect(merged[0].pipeline_steps).toEqual(["dev", "qa"]);
    expect(merged[0].workspace_root).toBe("/tmp/project-a");
    expect(merged[0].durationMs).toBe(4 * 60 * 1000);
  });

  it("keeps a local-only row the server does not know about", () => {
    const merged = mergeRunRows([localEntry()], [serverRun()]);

    expect(merged.map((row) => row.taskId)).toEqual(["server-run", "local-run"]);
  });

  it("de-duplicates a run both sides know by task id", () => {
    const merged = mergeRunRows(
      [localEntry({ taskId: "shared-run" })],
      [serverRun({ taskId: "shared-run" })],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("local-id");
    expect(merged[0].agent_config).toEqual({ scenario: "fix_bug" });
  });

  it("lets the server correct a local status that went stale", () => {
    const merged = mergeRunRows(
      [localEntry({ taskId: "shared-run", status: "running" })],
      [serverRun({ taskId: "shared-run", status: "failed" })],
    );

    expect(merged[0].status).toBe("failed");
  });

  it("keeps a server status the UI has no label for out of the row", () => {
    const merged = mergeRunRows([], [serverRun({ status: "invented_status" })]);

    expect(merged[0].status).toBeNull();
  });

  it("carries the artifacts_incomplete status through", () => {
    const merged = mergeRunRows(
      [],
      [serverRun({ status: "artifacts_incomplete", hasPipelineSnapshot: false })],
    );

    expect(merged[0].status).toBe("artifacts_incomplete");
  });

  it("orders the merged rows newest first", () => {
    const merged = mergeRunRows(
      [
        localEntry({ id: "old-local", taskId: "old-local", at: 1000 }),
        localEntry({ id: "new-local", taskId: "new-local", at: 9000 }),
      ],
      [serverRun({ taskId: "middle", createdAt: "1970-01-01T00:00:05.000Z" })],
    );

    expect(merged.map((row) => row.taskId)).toEqual([
      "new-local",
      "middle",
      "old-local",
    ]);
  });

  it("does not let a local row without a task id swallow a server run", () => {
    const merged = mergeRunRows([localEntry({ taskId: null })], [serverRun()]);

    expect(merged).toHaveLength(2);
  });
});
