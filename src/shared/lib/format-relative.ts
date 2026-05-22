export function formatRelativeShort(value: number | null | undefined): string {
  if (!value) return "";
  const delta = Date.now() - value;
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function formatDurationShort(ms: number | null | undefined): string | undefined {
  if (!ms || ms <= 0) return undefined;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

export function formatDurationOrDash(ms: number | null | undefined): string {
  return formatDurationShort(ms) ?? "—";
}
