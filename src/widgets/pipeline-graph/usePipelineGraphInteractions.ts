import { ref, onMounted, onUnmounted, watch, nextTick, type Ref } from "vue";
import Sortable from "sortablejs";
import type { GraphStepRef } from "@/widgets/pipeline-graph/usePipelineGraphLayout";

export interface ReorderEmit {
  (oldIdx: number, newIdx: number, count: number): void;
}

export interface PipelineGraphInteractionsOptions {
  container: Ref<HTMLElement | null>;
  topology: Ref<string>;
  parallelStages: Ref<GraphStepRef[][]>;
  editorEnabled: Ref<boolean>;
  /** Joined-key signal that changes when the visible step list changes. */
  stepSignal: Ref<string>;
  onReorder: ReorderEmit;
}

/**
 * Encapsulates SortableJS lifecycle for the pipeline graph. Keeps
 * drag-and-drop reorder translation (parallel stages vs flat cards) in one
 * place so the parent component stays focused on layout.
 *
 * Behaviour is identical to the inline version that used to live inside
 * PipelineGraph.vue — see commit history for the detailed reasoning about
 * pre-removal indices on forward moves.
 */
export function usePipelineGraphInteractions(
  options: PipelineGraphInteractionsOptions,
) {
  const sortableInstance = ref<Sortable | null>(null);

  function destroySortable(): void {
    if (sortableInstance.value) {
      try {
        sortableInstance.value.destroy();
      } catch {
        /* */
      }
      sortableInstance.value = null;
    }
  }

  function initSortable(): void {
    destroySortable();
    if (!options.container.value || !options.editorEnabled.value) return;

    const currentTopo = options.topology.value;
    const draggable = currentTopo === "parallel" ? ".step-stage" : ".step-card";

    sortableInstance.value = Sortable.create(options.container.value, {
      animation: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      handle: ".step-drag-handle",
      draggable,
      filter: ".step-remove-btn, .step-select",
      preventOnFilter: false,
      ghostClass: "step-sortable-ghost",
      chosenClass: "step-sortable-chosen",
      dragClass: "step-sortable-drag",
      forceFallback: true,
      fallbackOnBody: true,
      fallbackTolerance: 3,
      swapThreshold: 0.65,
      invertSwap: true,
      group:
        currentTopo === "parallel"
          ? { name: "stages", pull: true, put: true }
          : undefined,
      onEnd(evt) {
        const oldIndex = evt.oldIndex;
        const newIndex = evt.newIndex;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex)
          return;

        if (currentTopo === "parallel") {
          const stages = options.parallelStages.value;
          const stage = stages[oldIndex];
          const oldFlat = stages.slice(0, oldIndex).flat().length;
          const newFlat =
            newIndex > oldIndex
              ? stages.slice(0, newIndex + 1).flat().length
              : stages.slice(0, newIndex).flat().length;
          options.onReorder(oldFlat, newFlat, stage?.length ?? 1);
        } else {
          const preRemovalNew = newIndex > oldIndex ? newIndex + 1 : newIndex;
          options.onReorder(oldIndex, preRemovalNew, 1);
        }
      },
    });
  }

  onMounted(() => nextTick(initSortable));
  onUnmounted(destroySortable);
  watch(options.stepSignal, () => nextTick(initSortable));
  watch(options.topology, () => nextTick(initSortable));

  return { initSortable, destroySortable };
}
