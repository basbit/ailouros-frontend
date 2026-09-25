import type { ResearchSession } from "@/shared/api/endpoints/autoresearch";

export interface ChartPoint {
  x: number;
  y: number;
  iteration: number;
  value: number;
  decision: "baseline" | "kept" | "reverted" | "error";
}

export interface MetricChart {
  points: ChartPoint[];
  bestLine: string;
  minValue: number;
  maxValue: number;
}

const PADDING = 8;

/** Measured values per iteration (baseline at x=0) plus the running-best step
 * line, scaled into a width x height box. Errors have no value and are skipped. */
export function buildMetricChart(
  session: Pick<ResearchSession, "baseline" | "iterations">,
  width: number,
  height: number,
): MetricChart | null {
  if (session.baseline === null || session.baseline === undefined) return null;
  const measured: Array<Omit<ChartPoint, "x" | "y">> = [
    { iteration: 0, value: session.baseline, decision: "baseline" },
  ];
  for (const iteration of session.iterations) {
    if (iteration.value === null || iteration.value === undefined) continue;
    measured.push({
      iteration: iteration.number,
      value: iteration.value,
      decision: iteration.decision,
    });
  }
  const values = measured.map((item) => item.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const span = maxValue - minValue || 1;
  const lastIteration = Math.max(1, session.iterations.length);
  const scaleX = (iteration: number) =>
    PADDING + (iteration / lastIteration) * (width - 2 * PADDING);
  const scaleY = (value: number) =>
    height - PADDING - ((value - minValue) / span) * (height - 2 * PADDING);
  const points = measured.map((item) => ({
    ...item,
    x: scaleX(item.iteration),
    y: scaleY(item.value),
  }));

  let best = session.baseline;
  const bestSteps: string[] = [`${scaleX(0)},${scaleY(best)}`];
  for (const iteration of session.iterations) {
    if (
      iteration.decision === "kept" &&
      iteration.value !== null &&
      iteration.value !== undefined
    ) {
      bestSteps.push(`${scaleX(iteration.number)},${scaleY(best)}`);
      best = iteration.value;
    }
    bestSteps.push(`${scaleX(iteration.number)},${scaleY(best)}`);
  }
  return { points, bestLine: bestSteps.join(" "), minValue, maxValue };
}
