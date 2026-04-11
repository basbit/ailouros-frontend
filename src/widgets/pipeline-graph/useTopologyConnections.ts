/**
 * useTopologyConnections — SVG overlay for ring/mesh topology connections.
 *
 * Draws SVG path connections between StepCard elements:
 * - ring: back-arc from last card to first card
 * - mesh: faint lines between all cards (all-to-all)
 *
 * Uses ResizeObserver to auto-update on layout changes.
 */
import { ref, onMounted, onUnmounted, watch, nextTick, type Ref } from "vue";

export interface ConnectionLine {
  id: string;
  d: string; // SVG path d attribute
  cssClass: string;
}

/**
 * Compute center coordinates of an element relative to a container.
 */
function centerOf(el: Element, container: Element): { x: number; y: number } {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return {
    x: er.left - cr.left + er.width / 2,
    y: er.top - cr.top + er.height / 2,
  };
}

/**
 * Build an SVG arc path from (x1,y1) to (x2,y2) with a curve offset.
 */
function arcPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curveOffset: number,
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - curveOffset;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

/**
 * Build a straight line path.
 */
function linePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

export function useTopologyConnections(
  containerRef: Ref<HTMLElement | null>,
  topology: Ref<string>,
  stepCount: Ref<number>,
) {
  const lines = ref<ConnectionLine[]>([]);
  const svgWidth = ref(0);
  const svgHeight = ref(0);
  let resizeObserver: ResizeObserver | null = null;

  function recalculate(): void {
    const container = containerRef.value;
    if (!container) {
      lines.value = [];
      return;
    }

    const topo = topology.value;
    const cards = Array.from(container.querySelectorAll(".step-card"));
    if (cards.length < 2) {
      lines.value = [];
      return;
    }

    const cr = container.getBoundingClientRect();
    svgWidth.value = cr.width;
    svgHeight.value = cr.height;

    const centers = cards.map((c) => centerOf(c, container));
    const result: ConnectionLine[] = [];

    if (topo === "ring") {
      // Back-arc from last to first
      const first = centers[0];
      const last = centers[centers.length - 1];
      const offset = Math.max(40, Math.abs(last.x - first.x) * 0.3);
      result.push({
        id: "ring-back",
        d: arcPath(last.x, last.y, first.x, first.y, offset),
        cssClass: "topo-conn-ring",
      });
    } else if (topo === "mesh") {
      // All-to-all faint connections
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          result.push({
            id: `mesh-${i}-${j}`,
            d: linePath(centers[i].x, centers[i].y, centers[j].x, centers[j].y),
            cssClass: "topo-conn-mesh",
          });
        }
      }
    }

    lines.value = result;
  }

  function setupObserver(): void {
    teardownObserver();
    const container = containerRef.value;
    if (!container) return;
    resizeObserver = new ResizeObserver(() => {
      recalculate();
    });
    resizeObserver.observe(container);
  }

  function teardownObserver(): void {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }

  onMounted(() => {
    nextTick(() => {
      setupObserver();
      recalculate();
    });
  });

  onUnmounted(teardownObserver);

  watch(topology, () => nextTick(recalculate));
  watch(stepCount, () => nextTick(recalculate));

  return {
    lines,
    svgWidth,
    svgHeight,
    recalculate,
  };
}
