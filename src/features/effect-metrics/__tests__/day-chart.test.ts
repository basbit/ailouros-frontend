import { describe, expect, it } from "vitest";
import { buildDayChart } from "../model/day-chart";

describe("buildDayChart", () => {
  it("stacks completed, failed and other runs scaled to the busiest day", () => {
    const chart = buildDayChart(
      [
        { day: "2026-09-15", total: 4, completed: 2, failed: 1 },
        { day: "2026-09-16", total: 2, completed: 0, failed: 0 },
      ],
      200,
      100,
    );

    expect(chart?.maxTotal).toBe(4);
    expect(chart?.bars[0]).toMatchObject({
      completedHeight: 50,
      failedHeight: 25,
      otherHeight: 25,
    });
    expect(chart?.bars[1]).toMatchObject({ completedHeight: 0, otherHeight: 50 });
    expect(chart?.bars[1].x).toBeGreaterThan(chart?.bars[0].x ?? 0);
  });

  it("has no chart without days and flat bars when every day is empty", () => {
    expect(buildDayChart([], 200, 100)).toBeNull();
    const empty = buildDayChart(
      [{ day: "2026-09-16", total: 0, completed: 0, failed: 0 }],
      200,
      100,
    );
    expect(empty?.maxTotal).toBe(0);
    expect(empty?.bars[0].otherHeight).toBe(0);
  });
});
