import { ref, onMounted, onUnmounted, watch, nextTick, type Ref } from "vue";
import Sortable from "sortablejs";
import type { GraphStepRef } from "@/widgets/pipeline-graph/usePipelineGraphLayout";

interface ReorderEmit {
  (oldIdx: number, newIdx: number, count: number): void;
}

export interface PipelineGraphInteractionsOptions {
  container: Ref<HTMLElement | null>;
  topology: Ref<string>;
  parallelStages: Ref<GraphStepRef[][]>;
  editorEnabled: Ref<boolean>;
  stepSignal: Ref<string>;
  onReorder: ReorderEmit;
}

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

    sortableInstance.value = Sortable.create(options.container.value, {
      animation: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      handle: ".step-drag-handle",
      draggable: ".step-card",
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
      onEnd(evt) {
        const oldIndex = evt.oldDraggableIndex;
        const newIndex = evt.newDraggableIndex;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex)
          return;
        const preRemovalNew = newIndex > oldIndex ? newIndex + 1 : newIndex;
        options.onReorder(oldIndex, preRemovalNew, 1);
      },
    });
  }

  onMounted(() => nextTick(initSortable));
  onUnmounted(destroySortable);
  watch(options.stepSignal, () => nextTick(initSortable));
  watch(options.topology, () => nextTick(initSortable));

  return { initSortable, destroySortable };
}
