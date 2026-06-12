import { formatEuropeanDateTime } from "@/shared/lib/format-date";
import { formatRelativeShort } from "@/shared/lib/format-relative";

export function promptPreviewOf(prompt: string): string {
  const first = (prompt ?? "").split("\n")[0];
  return first.length > 120 ? `${first.slice(0, 119)}…` : first;
}

export function formatDate(value: number | null | undefined): string {
  return formatEuropeanDateTime(value) || "—";
}

export const formatRelative = formatRelativeShort;
