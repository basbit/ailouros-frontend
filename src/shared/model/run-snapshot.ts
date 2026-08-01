/**
 * A run snapshot is written twice in two different shapes: mid-run it is flat,
 * and once the run finalises the state lands under `partial_state`. Readers of
 * a single section have to cope with both, the same way the backend's
 * `pipeline_metrics_from_artifact` does.
 */
export function readRunSnapshotSection(
  snapshot: unknown,
  key: string,
): Record<string, unknown> | null {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const plan = snapshot as Record<string, unknown>;

  const direct = plan[key];
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }

  const partial = plan.partial_state;
  if (!partial || typeof partial !== "object" || Array.isArray(partial)) return null;
  const nested = (partial as Record<string, unknown>)[key];
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  return null;
}
