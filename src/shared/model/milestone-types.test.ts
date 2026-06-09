import { describe, expect, it } from "vitest";

import { parseMilestonePayload } from "./milestone-types";

describe("parseMilestonePayload", () => {
  it("returns null when milestone_id is missing", () => {
    expect(parseMilestonePayload({})).toBeNull();
    expect(parseMilestonePayload(null)).toBeNull();
  });

  it("parses the full nested tree from snake_case payload", () => {
    const parsed = parseMilestonePayload({
      milestone_id: "m1",
      title: "Bootstrap",
      status: "active",
      plans: [
        {
          plan_id: "m1-p1",
          title: "Design",
          status: "pending",
          waves: [
            {
              wave_id: "m1-p1-w1",
              title: "Wave 1",
              status: "pending",
              tasks: [
                { task_id: "t1", title: "Task A", status: "done" },
                { task_id: "t2", title: "Task B", status: "blocked" },
              ],
            },
          ],
        },
      ],
    });
    expect(parsed?.milestoneId).toBe("m1");
    expect(parsed?.status).toBe("active");
    expect(parsed?.plans).toHaveLength(1);
    expect(parsed?.plans[0].waves[0].tasks).toHaveLength(2);
    expect(parsed?.plans[0].waves[0].tasks[1].status).toBe("blocked");
  });

  it("defaults unknown status values to 'pending'", () => {
    const parsed = parseMilestonePayload({
      milestone_id: "m1",
      status: "not-a-status",
    });
    expect(parsed?.status).toBe("pending");
  });

  it("drops malformed child entries without breaking parents", () => {
    const parsed = parseMilestonePayload({
      milestone_id: "m1",
      plans: [
        { plan_id: "p1", title: "ok", waves: [] },
        "not-an-object",
        { title: "missing id" },
      ],
    });
    expect(parsed?.plans).toHaveLength(1);
    expect(parsed?.plans[0].planId).toBe("p1");
  });

  it("returns empty arrays when children are absent", () => {
    const parsed = parseMilestonePayload({ milestone_id: "m1" });
    expect(parsed?.plans).toEqual([]);
  });
});
