import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h, ref, nextTick } from "vue";
import { mount } from "@vue/test-utils";

const sortableInstances: Array<{
  options: Record<string, unknown>;
  destroy: () => void;
}> = [];

vi.mock("sortablejs", () => {
  return {
    default: {
      create: (_el: HTMLElement, options: Record<string, unknown>) => {
        const instance = { options, destroy: () => undefined };
        sortableInstances.push(instance);
        return instance;
      },
    },
  };
});

import { usePipelineGraphInteractions } from "@/widgets/pipeline-graph/usePipelineGraphInteractions";

describe("usePipelineGraphInteractions", () => {
  beforeEach(() => {
    sortableInstances.length = 0;
  });

  afterEach(() => {
    sortableInstances.length = 0;
  });

  function mountHostComponent(
    topology: string,
    onReorder: (a: number, b: number, c: number) => void,
  ) {
    const Host = defineComponent({
      setup() {
        const container = ref<HTMLElement | null>(null);
        const stepSignal = ref("a|b|c");
        const editorEnabled = ref(true);
        const topo = ref(topology);
        const parallelStages = ref([] as { id: string; index: number }[][]);

        usePipelineGraphInteractions({
          container,
          topology: topo,
          parallelStages,
          editorEnabled,
          stepSignal,
          onReorder,
        });

        return () => h("div", { ref: container }, []);
      },
    });
    return mount(Host);
  }

  it("uses draggable indices for ring topology to skip non-draggable SVG siblings", async () => {
    const onReorder = vi.fn();
    mountHostComponent("ring", onReorder);
    await nextTick();

    expect(sortableInstances).toHaveLength(1);
    const onEnd = sortableInstances[0].options.onEnd as (event: unknown) => void;

    onEnd({
      oldIndex: 2,
      newIndex: 4,
      oldDraggableIndex: 1,
      newDraggableIndex: 3,
    });

    expect(onReorder).toHaveBeenCalledWith(1, 4, 1);
  });

  it("ignores no-op moves where draggable indices match", async () => {
    const onReorder = vi.fn();
    mountHostComponent("ring", onReorder);
    await nextTick();

    const onEnd = sortableInstances[0].options.onEnd as (event: unknown) => void;
    onEnd({
      oldIndex: 5,
      newIndex: 7,
      oldDraggableIndex: 2,
      newDraggableIndex: 2,
    });

    expect(onReorder).not.toHaveBeenCalled();
  });
});
