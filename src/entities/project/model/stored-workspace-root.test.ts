import { beforeEach, describe, expect, it } from "vitest";
import { readStoredWorkspaceRoot } from "./stored-workspace-root";
import { LS_PROJECTS, LS_SETTINGS } from "@/shared/lib/swarm-ui-constants";

describe("readStoredWorkspaceRoot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("is empty when nothing is stored", () => {
    expect(readStoredWorkspaceRoot()).toBe("");
  });

  it("returns the selected project's trimmed workspace root", () => {
    localStorage.setItem(
      LS_PROJECTS,
      JSON.stringify({
        current: "p2",
        projects: {
          p1: { snap: { workspace_root: "/other" } },
          p2: { snap: { workspace_root: "  /ws/current  " } },
        },
      }),
    );
    expect(readStoredWorkspaceRoot()).toBe("/ws/current");
  });

  it("falls back to the legacy settings blob when the project has no root", () => {
    localStorage.setItem(
      LS_PROJECTS,
      JSON.stringify({ current: "p1", projects: { p1: { snap: {} } } }),
    );
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ workspace_root: "/legacy" }));
    expect(readStoredWorkspaceRoot()).toBe("/legacy");
  });

  it("survives a malformed projects blob", () => {
    localStorage.setItem(LS_PROJECTS, "{not json");
    localStorage.setItem(LS_SETTINGS, JSON.stringify({ workspace_root: "/legacy" }));
    expect(readStoredWorkspaceRoot()).toBe("/legacy");
  });
});
