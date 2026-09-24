import { describe, expect, it } from "vitest";
import {
  ACTIVE_TASK_STATUSES,
  KNOWN_TASK_STATUSES,
  AWAITING_TASK_STATUSES,
  RESUMABLE_TASK_STATUSES,
  TERMINAL_TASK_STATUSES,
  formatTaskStatus,
  hasVisibleGate,
  isRunAwaiting,
  isTaskActive,
  isTaskAwaiting,
  isTaskResumable,
  isTaskTerminal,
  parseTaskStatus,
} from "./task-status";

describe("task-status helpers", () => {
  it("recognizes every active status as active and non-terminal", () => {
    for (const status of ACTIVE_TASK_STATUSES) {
      expect(isTaskActive(status)).toBe(true);
      expect(isTaskTerminal(status)).toBe(false);
    }
  });

  it("recognizes every terminal status as terminal and inactive", () => {
    for (const status of TERMINAL_TASK_STATUSES) {
      expect(isTaskTerminal(status)).toBe(true);
      expect(isTaskActive(status)).toBe(false);
    }
  });

  it("does not silently classify unknown statuses", () => {
    expect(isTaskActive("queued")).toBe(false);
    expect(isTaskTerminal("queued")).toBe(false);
  });

  it("treats a run with incomplete artifacts as finished, not resumable", () => {
    expect(isTaskTerminal("artifacts_incomplete")).toBe(true);
    expect(isTaskActive("artifacts_incomplete")).toBe(false);
    expect(isTaskResumable("artifacts_incomplete")).toBe(false);
  });

  it("parses the statuses the server-side run history can report", () => {
    for (const status of KNOWN_TASK_STATUSES) {
      expect(parseTaskStatus(status)).toBe(status);
    }
    expect(parseTaskStatus("artifacts_incomplete")).toBe("artifacts_incomplete");
    expect(parseTaskStatus("  COMPLETED ")).toBe("completed");
    expect(parseTaskStatus("invented_status")).toBeNull();
    expect(parseTaskStatus(null)).toBeNull();
  });

  it("every awaiting status is an active one — a paused run is still a run", () => {
    for (const status of AWAITING_TASK_STATUSES) {
      expect(isTaskAwaiting(status)).toBe(true);
      expect(isTaskActive(status)).toBe(true);
    }
  });

  it("every resumable status is known to the other lists or terminal", () => {
    for (const status of RESUMABLE_TASK_STATUSES) {
      expect(isTaskResumable(status)).toBe(true);
    }
  });
});

const quietLive = {
  taskId: "live",
  humanGateVisible: false,
  shellGateVisible: false,
  manualShellGateVisible: false,
  pendingApprovals: 0,
};

describe("task-status — the one awaiting definition", () => {
  it("awaiting statuses are the three gate pauses, case-insensitive", () => {
    expect(isTaskAwaiting("awaiting_human")).toBe(true);
    expect(isTaskAwaiting("AWAITING_SHELL_CONFIRM")).toBe(true);
    expect(isTaskAwaiting("awaiting_manual_shell")).toBe(true);
    expect(isTaskAwaiting("running")).toBe(false);
    expect(isTaskAwaiting(null)).toBe(false);
  });

  it("a run is awaiting by its own status, or because it IS the live run with a gate open", () => {
    const gated = { ...quietLive, humanGateVisible: true };
    expect(isRunAwaiting({ taskId: "live", status: "running" }, gated)).toBe(true);
    expect(isRunAwaiting({ taskId: "other", status: "running" }, gated)).toBe(false);
    expect(isRunAwaiting({ taskId: null, status: "running" }, gated)).toBe(false);
    expect(isRunAwaiting({ taskId: "other", status: "awaiting_human" }, quietLive)).toBe(true);
  });

  it("hasVisibleGate counts pending approvals as a gate", () => {
    expect(hasVisibleGate(quietLive)).toBe(false);
    expect(hasVisibleGate({ ...quietLive, pendingApprovals: 1 })).toBe(true);
  });

  it("list and detail agree on what can be resumed", () => {
    expect(isTaskResumable("awaiting_shell_confirm")).toBe(true);
    expect(isTaskResumable("awaiting_manual_shell")).toBe(true);
    expect(isTaskResumable("completed")).toBe(false);
  });

  it("formatTaskStatus translates known keys and falls back to the raw status", () => {
    const t = (key: string) => (key === "history.completed" ? "Done" : key);
    expect(formatTaskStatus(t, "completed")).toBe("Done");
    expect(formatTaskStatus(t, "weird_status")).toBe("weird_status");
    expect(formatTaskStatus(t, null)).toBe("—");
    expect(formatTaskStatus(t, null, "")).toBe("");
  });
});
