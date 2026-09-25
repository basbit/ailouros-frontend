import { describe, expect, it } from "vitest";
import {
  missingPrerequisites,
  refusalBeyondPrerequisites,
} from "@/features/autoresearch/model/prerequisites";

const allowed = { swarm_allow_workspace_write: true, swarm_allow_command_exec: true };

describe("autoresearch prerequisites", () => {
  it("names the switches that are off, exec only for a metric command", () => {
    const off = { swarm_allow_workspace_write: false, swarm_allow_command_exec: false };
    expect(missingPrerequisites(off, "", true)).toEqual(["write", "exec"]);
    expect(missingPrerequisites(off, "", false)).toEqual(["write"]);
    expect(missingPrerequisites(allowed, "", true)).toEqual([]);
  });

  it("adds what the server's refusal names, such as the shell allowlist", () => {
    const refusal =
      "autoresearch preflight failed: metric_command 'make bench' is not allowed: not in allowlist: 'make' (user approval can extend the per-task allowlist)";
    expect(missingPrerequisites(allowed, refusal, true)).toEqual(["allowlist"]);
    expect(refusalBeyondPrerequisites(refusal)).toBe("");
  });

  it("keeps the problems no hint explains", () => {
    const refusal =
      "autoresearch preflight failed: workspace writes are disabled: autoresearch cannot edit files until Settings → Autonomous work → Allow workspace writes (SWARM_ALLOW_WORKSPACE_WRITE) is on; grader file missing: tests/grade.py";
    expect(refusalBeyondPrerequisites(refusal)).toBe(
      "autoresearch preflight failed: grader file missing: tests/grade.py",
    );
    expect(refusalBeyondPrerequisites("network error")).toBe("network error");
  });
});
