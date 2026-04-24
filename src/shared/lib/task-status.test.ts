import { describe, expect, it } from "vitest";
import {
  ACTIVE_TASK_STATUSES,
  TERMINAL_TASK_STATUSES,
  isTaskActive,
  isTaskTerminal,
} from "@/shared/lib/task-status";

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
});
