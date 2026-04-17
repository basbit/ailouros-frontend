/**
 * usePipeline — reactive state for pipeline steps.
 * Mirrors createPipeRow, pipeRenderFromSnap, pipeReset, collectPipelineRowsSnap, etc.
 */
import { ref } from "vue";
import { PIPELINE_OPTIONS_BASE } from "@/shared/lib/pipeline-schema";
import { defaultPipelineOrder } from "@/shared/lib/use-swarm-defaults";
import type { CustomRoleSnap } from "@/shared/store/projects";

export interface PipeStep {
  id: string;
  uid: string;
}

type StageGroup = string[];

function _uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now()) + Math.random().toString(36).slice(2);
}

export function pipelineOptionsAll(customRoles: CustomRoleSnap[]): [string, string][] {
  const out: [string, string][] = PIPELINE_OPTIONS_BASE.slice() as [string, string][];
  for (const r of customRoles) {
    if (r.id && /^[a-z][a-z0-9_]{0,63}$/.test(r.id)) {
      out.push(["crole_" + r.id, "Custom: " + (r.label || r.id)]);
    }
  }
  return out;
}

export function usePipeline(
  customRoles: { value: CustomRoleSnap[] },
  onChangeCb: () => void,
) {
  const steps = ref<PipeStep[]>([]);
  const stageGroups = ref<StageGroup[]>([]);

  function createStep(id: string): PipeStep {
    return { id, uid: _uid() };
  }

  function defaultStageGroups(nextSteps: PipeStep[]): StageGroup[] {
    return nextSteps.map((step) => [step.uid]);
  }

  function normalizeStageGroups(nextGroups: StageGroup[]): void {
    if (!steps.value.length) {
      stageGroups.value = [];
      return;
    }

    const order = new Map(steps.value.map((step, index) => [step.uid, index]));
    const used = new Set<string>();
    const normalized: StageGroup[] = [];

    for (const group of nextGroups) {
      const kept: StageGroup = [];
      for (const uid of group) {
        if (!order.has(uid) || used.has(uid)) continue;
        kept.push(uid);
        used.add(uid);
      }
      if (kept.length) normalized.push(kept);
    }

    for (const step of steps.value) {
      if (used.has(step.uid)) continue;
      normalized.push([step.uid]);
      used.add(step.uid);
    }

    for (const group of normalized) {
      group.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
    }
    normalized.sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0));

    stageGroups.value = normalized.length
      ? normalized
      : defaultStageGroups(steps.value);
  }

  function getOptions(): [string, string][] {
    return pipelineOptionsAll(customRoles.value);
  }

  function reset(): void {
    steps.value = defaultPipelineOrder().map((id) => createStep(id));
    _rebuildDefaultStages();
    onChangeCb();
  }

  function addStep(): void {
    const nextStep = createStep("pm");
    steps.value = [...steps.value, nextStep];
    normalizeStageGroups([...stageGroups.value, [nextStep.uid]]);
    onChangeCb();
  }

  function removeStep(idx: number): void {
    const removed = steps.value[idx];
    if (!removed) return;
    steps.value.splice(idx, 1);
    normalizeStageGroups(
      stageGroups.value
        .map((group) => group.filter((uid) => uid !== removed.uid))
        .filter((group) => group.length),
    );
    onChangeCb();
  }

  function updateStep(idx: number, id: string): void {
    if (!steps.value[idx]) return;
    // Replace the element so Vue's reactivity tracks the array mutation.
    const arr = steps.value.slice();
    arr[idx] = { ...arr[idx], id };
    steps.value = arr;
    onChangeCb();
  }

  function applySnap(rows: { id: string }[]): void {
    steps.value = rows
      .map((r) => createStep(typeof r === "string" ? r : String(r.id ?? "")))
      .filter((r) => r.id);
    if (!steps.value.length) {
      reset();
      return;
    }
    _rebuildDefaultStages();
  }

  /** Replace step list with *ids* (used by "Reset to recommended for topology"). */
  function applyStepIds(ids: ReadonlyArray<string>): void {
    steps.value = ids.map((id) => createStep(id));
    _rebuildDefaultStages();
    onChangeCb();
  }

  function collectSnap(): { id: string }[] {
    return steps.value.map((s) => ({ id: s.id }));
  }

  function collectStepIds(): string[] {
    return steps.value.map((s) => s.id);
  }

  /**
   * Move a contiguous range of *count* steps from *oldIdx* to *newIdx*.
   *
   * ``count === 1`` is the single-card case. ``count > 1`` is the grouped
   * parallel-stage case where multiple cards are dragged as one unit —
   * **all** cards must move together, not just the first one
   * (bug: dropping a 2-card parallel stage previously moved only the
   * first card, leaving the second orphaned in the old slot).
   *
   * *newIdx* is the pre-removal destination index (i.e. the index the
   * caller sees in the flattened list before the range is extracted).
   */
  function reorder(oldIdx: number, newIdx: number, count = 1): void {
    const total = steps.value.length;
    if (count < 1) return;
    if (oldIdx < 0 || oldIdx + count > total) return;
    if (newIdx < 0 || newIdx > total) return;
    if (oldIdx === newIdx) return;
    const arr = steps.value.slice();
    const moved = arr.splice(oldIdx, count);
    if (!moved.length) return;
    // Adjust destination when removing *before* the insertion point shifts it left.
    const insertAt = newIdx > oldIdx ? newIdx - count : newIdx;
    arr.splice(insertAt, 0, ...moved);
    steps.value = arr;
    normalizeStageGroups(stageGroups.value);
    onChangeCb();
  }

  // ── Stages (parallel groups) ──────────────────────────────────────────────
  // stages[i] = array of step UIDs that run in parallel.
  // Default: each step is its own sequential stage.
  function _rebuildDefaultStages(): void {
    stageGroups.value = defaultStageGroups(steps.value);
  }

  /** Group two steps into a parallel stage. */
  function groupSteps(idxA: number, idxB: number): void {
    if (idxA === idxB) return;
    const uidA = steps.value[idxA]?.uid;
    const uidB = steps.value[idxB]?.uid;
    if (!uidA || !uidB) return;
    // Find which stages contain these steps.
    let stageA = -1;
    let stageB = -1;
    for (let si = 0; si < stageGroups.value.length; si++) {
      if (stageGroups.value[si].includes(uidA)) stageA = si;
      if (stageGroups.value[si].includes(uidB)) stageB = si;
    }
    if (stageA === -1 || stageB === -1 || stageA === stageB) return;
    // Merge stageB into stageA
    const merged = [...stageGroups.value[stageA], ...stageGroups.value[stageB]];
    const newGroups = stageGroups.value.filter((_, i) => i !== stageA && i !== stageB);
    // Insert merged group at the earlier position
    const insertAt = Math.min(stageA, stageB);
    newGroups.splice(insertAt, 0, merged);
    normalizeStageGroups(newGroups);
    onChangeCb();
  }

  /** Ungroup a step from its parallel stage back to its own sequential stage. */
  function ungroupStep(stepIdx: number): void {
    const uid = steps.value[stepIdx]?.uid;
    if (!uid) return;
    for (let si = 0; si < stageGroups.value.length; si++) {
      const group = stageGroups.value[si];
      const pos = group.indexOf(uid);
      if (pos === -1) continue;
      if (group.length <= 1) return; // already alone
      // Remove from current group and create a new single-step stage after it
      const newGroup = group.filter((_, i) => i !== pos);
      const newGroups = [...stageGroups.value];
      newGroups[si] = newGroup;
      newGroups.splice(si + 1, 0, [uid]);
      normalizeStageGroups(newGroups);
      onChangeCb();
      return;
    }
  }

  /** Collect pipeline_stages (string[][]) for the API.
   *  Uses stageGroups if configured; otherwise wraps each step as a single-step stage.
   */
  function collectStages(): string[][] {
    if (!steps.value.length) return [];
    const idsByUid = new Map(steps.value.map((step) => [step.uid, step.id]));
    const stages = stageGroups.value
      .map((group) =>
        group.map((uid) => idsByUid.get(uid)).filter((id): id is string => !!id),
      )
      .filter((group) => group.length);
    return stages.length ? stages : steps.value.map((step) => [step.id]);
  }

  /** Apply a stages snapshot from saved settings. */
  function applyStagesSnap(stages: string[][]): void {
    const flat = stages
      .flat()
      .map((id) => createStep(id))
      .filter((s) => s.id);
    steps.value = flat.length ? flat : [];
    if (!steps.value.length) {
      reset();
      return;
    }
    // Rebuild stage groups from the stages structure.
    let offset = 0;
    stageGroups.value = stages.map((stage) => {
      const group = flat.slice(offset, offset + stage.length).map((step) => step.uid);
      offset += stage.length;
      return group;
    });
    normalizeStageGroups(stageGroups.value);
  }

  return {
    steps,
    stageGroups,
    getOptions,
    reset,
    addStep,
    removeStep,
    updateStep,
    applySnap,
    collectSnap,
    collectStepIds,
    collectStages,
    applyStagesSnap,
    reorder,
    groupSteps,
    ungroupStep,
    applyStepIds,
  };
}
