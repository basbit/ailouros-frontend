import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Milestone } from "@/entities/milestone";

import { resetMilestones, useMilestones } from "./useMilestones";

const listMock = vi.fn<(workspaceRoot: string) => Promise<Milestone[]>>();

vi.mock("@/shared/api/endpoints/milestones", () => ({
  listMilestones: (workspaceRoot: string) => listMock(workspaceRoot),
}));

function buildMilestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    milestoneId: "m1",
    title: "Bootstrap",
    status: "pending",
    plans: [],
    ...overrides,
  };
}

describe("useMilestones", () => {
  beforeEach(() => {
    resetMilestones();
    listMock.mockReset();
  });

  it("starts with no milestones and not loading", () => {
    const view = useMilestones();
    expect(view.milestones.value).toEqual([]);
    expect(view.loading.value).toBe(false);
    expect(view.visible.value).toBe(false);
  });

  it("refresh trims root and skips network when blank", async () => {
    const view = useMilestones();
    await view.refresh("   ");
    expect(listMock).not.toHaveBeenCalled();
  });

  it("refresh populates milestones and toggles loading", async () => {
    listMock.mockResolvedValue([
      buildMilestone(),
      buildMilestone({ milestoneId: "m2" }),
    ]);
    const view = useMilestones();
    const requestPromise = view.refresh("/tmp/w");
    expect(view.loading.value).toBe(true);
    await requestPromise;
    expect(view.loading.value).toBe(false);
    expect(view.milestones.value).toHaveLength(2);
    expect(view.visible.value).toBe(true);
  });

  it("refresh records the error message when the request fails", async () => {
    listMock.mockRejectedValue(new Error("500 Internal"));
    const view = useMilestones();
    await view.refresh("/tmp/w");
    expect(view.lastError.value).toBe("500 Internal");
    expect(view.milestones.value).toEqual([]);
  });

  it("clear resets the composable", async () => {
    listMock.mockResolvedValue([buildMilestone()]);
    const view = useMilestones();
    await view.refresh("/tmp/w");
    view.clear();
    expect(view.milestones.value).toEqual([]);
  });
});
