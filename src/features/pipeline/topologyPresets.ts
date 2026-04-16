/**
 * Topology presets: derive a UI-friendly stage grouping from a topology name.
 *
 * This is a declarative mapping (topology → list of stage groupings), not a
 * workflow embedded in code.  The user can still manually regroup any step
 * after applying a preset.  The backend never sees "topology" as an
 * execution instruction for linear/parallel cases — it only sees the
 * resulting `pipeline_stages`.
 *
 * Ring and mesh topologies additionally set a flag in `agent_config.swarm`
 * that existing backend nodes already respect:
 *   - `mesh`  → `dev.py` parallelises dev-subtasks when swarm.topology === "mesh"
 *   - `ring`  → (no extra backend flag today) — retry gates are already global
 */

export type TopologyId = "linear" | "parallel" | "hierarchical" | "ring" | "mesh";

/**
 * A single preset entry: how to regroup adjacent steps when the topology is applied.
 * Each pair ``[a, b]`` means: if both ``a`` and ``b`` appear in the step list
 * *adjacent* to each other, merge them into the same stage.
 *
 * Non-matching steps stay in their own single-step stages.
 */
export interface TopologyPreset {
  id: TopologyId;
  /** Human-readable label for the UI. */
  label: string;
  /**
   * Pairs of step ids that should share a stage when present adjacently.
   * Empty → all steps stay in their own stage (sequential).
   */
  mergePairs: ReadonlyArray<readonly [string, string]>;
  /**
   * Additional flags to inject into ``agent_config.swarm`` when this
   * preset is active.  Honours the review-rules §3 principle: the UI
   * declares intent, backend simply reads flags.
   */
  swarmFlags?: Readonly<Record<string, unknown>>;
  /**
   * Recommended minimal step list for this topology. Rendered as the
   * "Reset to recommended" option in the PipelineGraph editor — lets the
   * user clear stale reviewers/human_gates accumulated from defaults or
   * earlier topology choices (bug: UI↔wire mismatch where wire carried
   * phantom ``review_pm`` the user didn't expect).
   */
  recommendedSteps: ReadonlyArray<string>;
}

/**
 * Canonical preset set.  Keyed by id for O(1) lookup.
 */
// Minimal core pipeline — agents only, no reviewers or human gates. Users
// can opt in to reviewers manually; we do NOT add them by default because
// local models often produce canned NEEDS_WORK and burn tokens (bug aec02899).
const _CORE_MINIMAL: ReadonlyArray<string> = [
  "clarify_input",
  "pm",
  "ba",
  "architect",
  "spec_merge",
  "dev_lead",
  "dev",
  "qa",
];

export const TOPOLOGY_PRESETS: Readonly<Record<TopologyId, TopologyPreset>> = {
  linear: {
    id: "linear",
    label: "Linear (sequential)",
    mergePairs: [],
    recommendedSteps: _CORE_MINIMAL,
  },
  parallel: {
    id: "parallel",
    label: "Parallel (BA ∥ Architect)",
    // BA and Architect can work concurrently — spec merge then collects both.
    mergePairs: [["ba", "architect"]],
    recommendedSteps: _CORE_MINIMAL,
  },
  hierarchical: {
    id: "hierarchical",
    label: "Hierarchical (PM → Dev Lead)",
    // Hierarchical is just sequential at the stage level; if the user wants
    // to skip BA/Architect they drop those steps manually.
    mergePairs: [],
    recommendedSteps: _CORE_MINIMAL,
  },
  ring: {
    id: "ring",
    label: "Ring (QA feedback loop)",
    mergePairs: [],
    // No backend flag today — retry gates are already enabled globally.
    recommendedSteps: _CORE_MINIMAL,
  },
  mesh: {
    id: "mesh",
    label: "Mesh (Dev subtasks parallel)",
    mergePairs: [],
    // dev.py already parallelises subtasks when swarm.topology === "mesh".
    swarmFlags: { topology: "mesh" },
    recommendedSteps: _CORE_MINIMAL,
  },
};

/** Look up the recommended step list for a topology; falls back to linear. */
export function recommendedStepsForTopology(
  topology: TopologyId | string,
): ReadonlyArray<string> {
  const preset = TOPOLOGY_PRESETS[topology as TopologyId];
  return preset ? preset.recommendedSteps : TOPOLOGY_PRESETS.linear.recommendedSteps;
}

/**
 * Return a list of parallel groups from a flat ``stepIds`` list according to
 * the preset's ``mergePairs``.  Example::
 *
 *   stepIds        = ["pm", "ba", "architect", "dev", "qa"]
 *   mergePairs     = [["ba", "architect"]]
 *   → [["pm"], ["ba", "architect"], ["dev"], ["qa"]]
 *
 * The function is deterministic and side-effect free.
 */
export function deriveStagesFromPreset(
  stepIds: ReadonlyArray<string>,
  preset: TopologyPreset,
): string[][] {
  const stages: string[][] = [];
  const pairs = preset.mergePairs.map((p) => [p[0], p[1]] as [string, string]);
  let i = 0;
  while (i < stepIds.length) {
    const cur = stepIds[i];
    const next = i + 1 < stepIds.length ? stepIds[i + 1] : null;
    const match = next
      ? pairs.find(([a, b]) => (cur === a && next === b) || (cur === b && next === a))
      : undefined;
    if (match && next) {
      stages.push([cur, next]);
      i += 2;
    } else {
      stages.push([cur]);
      i += 1;
    }
  }
  return stages;
}

/**
 * Convenience wrapper: look up preset by id and derive stages.
 * Returns an empty array when ``stepIds`` is empty.
 */
export function deriveStagesForTopology(
  stepIds: ReadonlyArray<string>,
  topology: TopologyId | string,
): string[][] {
  if (!stepIds.length) return [];
  const preset = TOPOLOGY_PRESETS[topology as TopologyId];
  if (!preset) {
    const valid = Object.keys(TOPOLOGY_PRESETS).join(", ");
    throw new Error(`Unknown topology "${topology}". Valid: ${valid}`);
  }
  return deriveStagesFromPreset(stepIds, preset);
}
