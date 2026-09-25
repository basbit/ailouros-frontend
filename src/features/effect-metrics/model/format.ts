/** Absent means the runs did not record it; it is shown as a dash, never as 0. */
export const ABSENT = "—";

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return ABSENT;
  return Math.round(value).toLocaleString("en-US");
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return ABSENT;
  return `${(value * 100).toFixed(1)}%`;
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return ABSENT;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return ABSENT;
  const whole = Math.round(seconds);
  if (whole < 60) return `${whole}s`;
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return `${minutes}m ${whole % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
