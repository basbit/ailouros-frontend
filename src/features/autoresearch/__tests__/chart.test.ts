import { describe, expect, it } from "vitest";
import { buildMetricChart } from "../model/chart";
import { makeIteration, makeSession } from "./fixtures";

describe("buildMetricChart", () => {
  it("has no chart before the baseline", () => {
    expect(
      buildMetricChart(makeSession({ baseline: null, iterations: [] }), 100, 50),
    ).toBeNull();
  });

  it("plots the baseline and every measured iteration, skipping errors", () => {
    const session = makeSession({
      iterations: [
        makeIteration({ number: 1, value: 80, decision: "kept" }),
        makeIteration({ number: 2, value: null, decision: "error", commit: "" }),
        makeIteration({ number: 3, value: 120, decision: "reverted", commit: "" }),
      ],
    });

    const chart = buildMetricChart(session, 100, 50);

    expect(chart?.points.map((point) => [point.iteration, point.decision])).toEqual([
      [0, "baseline"],
      [1, "kept"],
      [3, "reverted"],
    ]);
    expect([chart?.minValue, chart?.maxValue]).toEqual([80, 120]);
  });

  it("maps the smallest value to the bottom and the largest to the top", () => {
    const session = makeSession({
      iterations: [makeIteration({ number: 1, value: 50 })],
    });

    const chart = buildMetricChart(session, 100, 50);

    const [baseline, kept] = chart!.points;
    expect(baseline.y).toBeLessThan(kept.y);
    expect(kept.y).toBe(42);
    expect(baseline.y).toBe(8);
  });

  it("the best line moves only on kept iterations", () => {
    const session = makeSession({
      iterations: [
        makeIteration({ number: 1, value: 50, decision: "kept" }),
        makeIteration({ number: 2, value: 150, decision: "reverted", commit: "" }),
      ],
    });

    const chart = buildMetricChart(session, 100, 50)!;
    const ys = chart.bestLine.split(" ").map((pair) => Number(pair.split(",")[1]));

    expect(new Set(ys.slice(-2)).size).toBe(1);
    expect(ys[0]).not.toBe(ys[ys.length - 1]);
  });
});
