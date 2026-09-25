import { reactive } from "vue";

/**
 * Settings the running server cannot apply (it reads them only at startup):
 * `requiredFields` are curated fields backed by one, `pending` the variables
 * changed since the server started.
 */
export const restartStatus = reactive<{ requiredFields: string[]; pending: string[] }>({
  requiredFields: [],
  pending: [],
});

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

/** Take whichever of the two lists the server response carries. */
export function applyRestartStatus(response: object): void {
  const raw = response as { restart_required_fields?: unknown; restart_pending?: unknown };
  const required = stringList(raw.restart_required_fields);
  const pending = stringList(raw.restart_pending);
  if (required) restartStatus.requiredFields = required;
  if (pending) restartStatus.pending = pending;
}
