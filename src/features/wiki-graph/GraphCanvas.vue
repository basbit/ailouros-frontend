<template>
  <div ref="containerRef" class="graph-canvas">
    <svg ref="svgRef" class="graph-canvas__svg" />
    <div v-if="tooltip" class="graph-canvas__tooltip" :style="tooltipStyle">
      <div class="graph-canvas__tooltip-title">{{ tooltip.title }}</div>
      <div class="graph-canvas__tooltip-tags">
        <span v-for="tag in tooltip.tags" :key="tag" class="graph-canvas__tag">{{
          tag
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import * as d3 from "d3";
import type { GraphData, GraphNode, GraphEdge } from "./useGraphData";

const props = defineProps<{
  data: GraphData;
  search: string;
}>();

const emit = defineEmits<{
  nodeClick: [nodeId: string];
}>();

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

interface TooltipState {
  title: string;
  tags: string[];
}

const tooltip = ref<TooltipState | null>(null);
const tooltipStyle = ref({ left: "0px", top: "0px" });

let simulation: d3.Simulation<GraphNode, GraphEdge> | null = null;
let resizeObserver: ResizeObserver | null = null;

type ResolvedEdge = GraphEdge & { source: GraphNode; target: GraphNode };

function _cssVar(name: string, fallback: string): string {
  if (!containerRef.value) return fallback;
  return getComputedStyle(containerRef.value).getPropertyValue(name).trim() || fallback;
}

function buildGraph(width: number, height: number): void {
  if (!svgRef.value) return;

  // Read theme colors from CSS variables so graph adapts to light/dark
  const colBorder = _cssVar("--border", "#2A241E");
  const colText = _cssVar("--text2", "#CBBFAD");
  const colEdge = _cssVar("--border-hi", "#4B4138");

  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();
  svg.attr("width", width).attr("height", height);

  // Defs for arrowheads
  const defs = svg.append("defs");
  defs
    .append("marker")
    .attr("id", "arrow")
    .attr("viewBox", "0 -3 6 6")
    .attr("refX", 14)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-3L6,0L0,3")
    .attr("fill", colEdge);

  // Zoom container
  const g = svg.append("g");
  svg.call(
    d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr("transform", String(event.transform));
      }),
  );

  // Deep copy nodes/edges so D3 can mutate them
  const nodes: GraphNode[] = props.data.nodes.map((n) => ({ ...n }));
  const edgesRaw = props.data.edges;

  const idToNode = new Map<string, GraphNode>(nodes.map((n) => [n.id, n]));
  const edges: ResolvedEdge[] = edgesRaw
    .map((e) => {
      const s =
        typeof e.source === "string" ? idToNode.get(e.source) : (e.source as GraphNode);
      const t =
        typeof e.target === "string" ? idToNode.get(e.target) : (e.target as GraphNode);
      return s && t ? ({ ...e, source: s, target: t } as ResolvedEdge) : null;
    })
    .filter((e): e is ResolvedEdge => e !== null);

  simulation = d3
    .forceSimulation<GraphNode>(nodes)
    .force(
      "link",
      d3
        .forceLink<GraphNode, ResolvedEdge>(edges)
        .id((d) => d.id)
        .distance(120),
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collision",
      d3.forceCollide<GraphNode>().radius((d) => d.size + 4),
    );

  // Edges
  const link = g
    .append("g")
    .selectAll("line")
    .data(edges)
    .join("line")
    .attr("stroke", colEdge)
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.7)
    .attr("marker-end", "url(#arrow)");

  // Nodes
  const node = g
    .append("g")
    .selectAll<SVGGElement, GraphNode>("g")
    .data(nodes)
    .join("g")
    .attr("cursor", "pointer")
    .call(
      d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active && simulation) simulation.alphaTarget(0);
          // Pin node at dropped position; double-click to unpin
          void d;
        }),
    )
    .on("click", (_event, d) => {
      emit("nodeClick", d.id);
    })
    .on("dblclick", (_event, d) => {
      d.fx = null;
      d.fy = null;
    })
    .on("mouseover", (event: MouseEvent, d) => {
      tooltip.value = { title: d.title, tags: d.tags };
      tooltipStyle.value = {
        left: `${event.offsetX + 12}px`,
        top: `${event.offsetY - 8}px`,
      };
    })
    .on("mouseout", () => {
      tooltip.value = null;
    });

  node
    .append("circle")
    .attr("r", (d) => d.size)
    .attr("fill", (d) => d.color)
    .attr("fill-opacity", 0.85)
    .attr("stroke", colBorder)
    .attr("stroke-width", 1.5);

  node
    .append("text")
    .attr("dy", (d) => d.size + 12)
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("fill", colText)
    .attr("pointer-events", "none")
    .text((d) => (d.title.length > 20 ? d.title.slice(0, 18) + "\u2026" : d.title));

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
      .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
      .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
      .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

    node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
  });

  // Apply initial search state
  applySearch(node);
}

function applySearch(
  nodeSelection: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>,
): void {
  const q = props.search.toLowerCase().trim();
  if (!q) {
    nodeSelection.select("circle").attr("fill-opacity", 0.85);
    return;
  }
  nodeSelection
    .select("circle")
    .attr("fill-opacity", (d) =>
      d.title.toLowerCase().includes(q) || d.tags.some((tag) => tag.includes(q))
        ? 1
        : 0.15,
    );
}

function getDimensions(): { width: number; height: number } {
  const el = containerRef.value;
  return el
    ? { width: el.clientWidth, height: el.clientHeight }
    : { width: 800, height: 600 };
}

watch(
  () => props.data,
  async () => {
    if (simulation) {
      simulation.stop();
      simulation = null;
    }
    await nextTick();
    const { width, height } = getDimensions();
    buildGraph(width, height);
  },
  { deep: true },
);

watch(
  () => props.search,
  () => {
    if (!svgRef.value) return;
    const nodeSelection = d3
      .select(svgRef.value)
      .select<SVGGElement>("g")
      .selectAll<SVGGElement, GraphNode>("g g");
    applySearch(nodeSelection);
  },
);

onMounted(async () => {
  await nextTick();
  const { width, height } = getDimensions();
  buildGraph(width, height);

  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      if (simulation) simulation.stop();
      const dims = getDimensions();
      buildGraph(dims.width, dims.height);
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (simulation) simulation.stop();
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped>
.graph-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--bg);
  border-radius: 6px;
  overflow: hidden;
}
.graph-canvas__svg {
  display: block;
  width: 100%;
  height: 100%;
}
.graph-canvas__tooltip {
  position: absolute;
  pointer-events: none;
  background: var(--bg);
  border: 1px solid var(--border-hi);
  border-radius: 6px;
  padding: 6px 10px;
  min-width: 120px;
  max-width: 240px;
  z-index: 10;
}
.graph-canvas__tooltip-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}
.graph-canvas__tooltip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.graph-canvas__tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 20%, transparent);
  color: var(--text2);
}
</style>
