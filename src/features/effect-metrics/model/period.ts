export type PeriodPreset = "7" | "30" | "custom";

export interface PeriodRange {
  from: string;
  to: string;
}

function isoDay(day: Date): string {
  return day.toISOString().slice(0, 10);
}

/** Whole UTC days ending today, today included — the same window the backend defaults to. */
export function lastDays(days: number, now: Date): PeriodRange {
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));
  return { from: isoDay(start), to: isoDay(end) };
}
