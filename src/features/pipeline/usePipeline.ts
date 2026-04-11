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

  function getOptions(): [string, string][] {
    return pipelineOptionsAll(customRoles.value);
  }

  function reset(): void {
    steps.value = defaultPipelineOrder().map((id) => ({ id, uid: _uid() }));
    _rebuildDefaultStages();
    onChangeCb();
  }

  function addStep(): void {
    steps.value.push({ id: "pm", uid: _uid() });
    onChangeCb();
  }

  function removeStep(idx: number): void {
    steps.value.splice(idx, 1);
    onChangeCb();
  }

  function updateStep(idx: number, id: string): void {
    if (steps.value[idx]) {
      steps.value[idx].id = id;
    }
    onChangeCb();
  }

  function applySnap(rows: { id: string }[]): void {
    steps.value = rows
      .map((r) => ({ id: typeof r === "string" ? r : String(r.id ?? ""), uid: _uid() }))
      .filter((r) => r.id);
    if (!steps.value.length) reset();
  }

  function collectSnap(): { id: string }[] {
    return steps.value.map((s) => ({ id: s.id }));
  }

  function collectStepIds(): string[] {
    return steps.value.map((s) => s.id);
  }

  function reorder(oldIdx: number, newIdx: number): void {
    const arr = steps.value.slice();
    const [item] = arr.splice(oldIdx, 1);
    arr.splice(newIdx, 0, item);
    steps.value = arr;
    onChangeCb();
  }

  // ── Stages (parallel groups) ──────────────────────────────────────────────
  // stages[i] = array of step indices that run in parallel.
  // Default: each step is its own sequential stage.
  const stageGroups = ref<number[][]>([]);

  function _rebuildDefaultStages(): void {
    stageGroups.value = steps.value.map((_, i) => [i]);
  }

  /** Group two steps into a parallel stage. */
  function groupSteps(idxA: number, idxB: number): void {
    if (idxA === idxB) return;
    // Find which stages contain these indices
    let stageA = -1;
    let stageB = -1;
    for (let si = 0; si < stageGroups.value.length; si++) {
      if (stageGroups.value[si].includes(idxA)) stageA = si;
      if (stageGroups.value[si].includes(idxB)) stageB = si;
    }
    if (stageA === -1 || stageB === -1 || stageA === stageB) return;
    // Merge stageB into stageA
    const merged = [...stageGroups.value[stageA], ...stageGroups.value[stageB]];
    const newGroups = stageGroups.value.filter((_, i) => i !== stageA && i !== stageB);
    // Insert merged group at the earlier position
    const insertAt = Math.min(stageA, stageB);
    newGroups.splice(insertAt, 0, merged);
    stageGroups.value = newGroups;
    onChangeCb();
  }

  /** Ungroup a step from its parallel stage back to its own sequential stage. */
  function ungroupStep(stepIdx: number): void {
    for (let si = 0; si < stageGroups.value.length; si++) {
      const group = stageGroups.value[si];
      const pos = group.indexOf(stepIdx);
      if (pos === -1) continue;
      if (group.length <= 1) return; // already alone
      // Remove from current group and create a new single-step stage after it
      const newGroup = group.filter((_, i) => i !== pos);
      const newGroups = [...stageGroups.value];
      newGroups[si] = newGroup;
      newGroups.splice(si + 1, 0, [stepIdx]);
      stageGroups.value = newGroups;
      onChangeCb();
      return;
    }
  }

  /** Collect pipeline_stages (string[][]) for the API.
   *  Uses stageGroups if configured; otherwise wraps each step as a single-step stage.
   */
  function collectStages(): string[][] {
    if (
      stageGroups.value.length > 0 &&
      stageGroups.value.length !== steps.value.length
    ) {
      // Real stage grouping exists
      return stageGroups.value.map((group) =>
        group.map((idx) => steps.value[idx]?.id).filter(Boolean),
      );
    }
    return steps.value.map((s) => [s.id]);
  }

  /** Apply a stages snapshot from saved settings. */
  function applyStagesSnap(stages: string[][]): void {
    const flat = stages
      .flat()
      .map((id) => ({ id, uid: _uid() }))
      .filter((s) => s.id);
    steps.value = flat.length ? flat : [];
    if (!steps.value.length) {
      reset();
      return;
    }
    // Rebuild stage groups from the stages structure
    let offset = 0;
    stageGroups.value = stages.map((stage) => {
      const indices = stage.map((_, i) => offset + i);
      offset += stage.length;
      return indices;
    });
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
  };
}
