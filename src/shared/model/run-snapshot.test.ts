import { describe, expect, it } from "vitest";

import { readRunSnapshotSection } from "./run-snapshot";

describe("readRunSnapshotSection", () => {
  it("reads a key a mid-run snapshot writes at the top level", () => {
    const plan = { session_spec_status: { status: "blocked" } };

    expect(readRunSnapshotSection(plan, "session_spec_status")).toEqual({
      status: "blocked",
    });
  });

  it("reads a key a finalised snapshot nests under partial_state", () => {
    const plan = { partial_state: { checkpoint_preview: { step_id: "human_qa" } } };

    expect(readRunSnapshotSection(plan, "checkpoint_preview")).toEqual({
      step_id: "human_qa",
    });
  });

  it("prefers the top level when both carry the key", () => {
    const plan = {
      session_spec_status: { status: "done" },
      partial_state: { session_spec_status: { status: "draft" } },
    };

    expect(readRunSnapshotSection(plan, "session_spec_status")).toEqual({
      status: "done",
    });
  });

  it("returns null when the snapshot is missing or the key is absent", () => {
    expect(readRunSnapshotSection(null, "session_spec_status")).toBeNull();
    expect(readRunSnapshotSection(undefined, "session_spec_status")).toBeNull();
    expect(readRunSnapshotSection({}, "session_spec_status")).toBeNull();
    expect(
      readRunSnapshotSection({ partial_state: {} }, "checkpoint_preview"),
    ).toBeNull();
  });

  it("ignores a non-object value rather than handing it on", () => {
    expect(
      readRunSnapshotSection({ session_spec_status: "blocked" }, "session_spec_status"),
    ).toBeNull();
    expect(
      readRunSnapshotSection({ partial_state: "nope" }, "checkpoint_preview"),
    ).toBeNull();
  });
});
