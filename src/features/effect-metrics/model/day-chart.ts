import type { DayRunCount } from "@/shared/api/endpoints/effect-metrics";

interface DayBar {
  day: string;
  x: number;
  width: number;
  completedHeight: number;
  failedHeight: number;
  otherHeight: number;
  total: number;
}

export interface DayChart {
  bars: DayBar[];
  maxTotal: number;
}

const GAP_RATIO = 0.2;

/** Stacked bars per day: completed at the bottom, failed above, every other status on top. */
export function buildDayChart(
  days: DayRunCount[],
  width: number,
  height: number,
): DayChart | null {
  if (!days.length) return null;
  const maxTotal = Math.max(...days.map((day) => day.total));
  const slot = width / days.length;
  const barWidth = slot * (1 - GAP_RATIO);
  const scale = maxTotal > 0 ? height / maxTotal : 0;
  const bars = days.map((day, index) => ({
    day: day.day,
    x: index * slot + (slot - barWidth) / 2,
    width: barWidth,
    completedHeight: day.completed * scale,
    failedHeight: day.failed * scale,
    otherHeight: (day.total - day.completed - day.failed) * scale,
    total: day.total,
  }));
  return { bars, maxTotal };
}
