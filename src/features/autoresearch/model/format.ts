export function formatMetricValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Number.isInteger(value)
    ? String(value)
    : value.toPrecision(6).replace(/\.?0+$/, "");
}

export function formatDeltaPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export const ACTIVE_SESSION_STATUSES: ReadonlySet<string> = new Set([
  "starting",
  "running",
]);

export function isSessionActive(status: string): boolean {
  return ACTIVE_SESSION_STATUSES.has(status);
}
