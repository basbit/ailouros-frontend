export type SpecStatusName =
  | "draft"
  | "ready-for-dev"
  | "in-progress"
  | "in-review"
  | "done"
  | "blocked";

export interface SpecStatus {
  readonly status: SpecStatusName;
  readonly blockingCondition: string;
  readonly isBlocked: boolean;
}

const KNOWN_STATUSES: ReadonlySet<string> = new Set<SpecStatusName>([
  "draft",
  "ready-for-dev",
  "in-progress",
  "in-review",
  "done",
  "blocked",
]);

export function parseSpecStatus(raw: unknown): SpecStatus | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Record<string, unknown>;
  const status = typeof candidate.status === "string" ? candidate.status.trim() : "";
  if (!KNOWN_STATUSES.has(status)) return null;
  const blockingCondition =
    typeof candidate.blocking_condition === "string"
      ? candidate.blocking_condition
      : "";
  return {
    status: status as SpecStatusName,
    blockingCondition,
    isBlocked: status === "blocked",
  };
}
