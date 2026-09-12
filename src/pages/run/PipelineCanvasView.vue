<template>
  <div class="pipeline-canvas-view">
    <div class="pipeline-canvas-view__toolbar">
      <div class="pipeline-canvas-view__title-group">
        <h2 class="pipeline-canvas-view__title">
          {{ t("pipelineCard.parallelPipes") }} ({{ t("runView.modes.canvas") }})
        </h2>
        <span class="pipeline-canvas-view__count-badge">
          {{ t("pipelineCanvas.nodeCount", { count: nodes.length }) }}
        </span>
      </div>

      <div class="pipeline-canvas-view__modes">
        <button
          type="button"
          class="pipeline-canvas-view__mode-btn"
          @click="navigateToMode('/run')"
        >
          {{ t("runView.modes.focus") }}
        </button>
        <button
          type="button"
          class="pipeline-canvas-view__mode-btn"
          @click="navigateToMode('/run/grid')"
        >
          {{ t("runView.modes.grid") }}
        </button>
        <button
          type="button"
          class="pipeline-canvas-view__mode-btn pipeline-canvas-view__mode-btn--active"
        >
          {{ t("runView.modes.canvas") }}
        </button>
      </div>
    </div>

    <div class="pipeline-canvas-view__canvas-container" @mousemove="onCanvasMouseMove">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 0.9 }"
        fit-view-on-init
        @node-drag-stop="onNodeDragStop"
      >
        <template #default>
          <Background :gap="20" :color="canvasPatternColor" :bg-color="canvasBgColor" />
          <MiniMap />
          <Controls />

          <div
            v-for="peer in coworking.peers.value"
            :key="peer.id"
            class="remote-cursor"
            :style="{
              transform: `translate3d(${peer.x}px, ${peer.y}px, 0)`,
              '--peer-color': peer.color,
            }"
          >
            <svg
              class="remote-cursor__icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M5.5 3.5l14 7-6.5 2-2 6.5-5.5-15.5z"
                :fill="peer.color"
                :stroke="peer.color"
              />
            </svg>
            <span class="remote-cursor__name" :style="{ background: peer.color }">
              {{ peer.name }}
            </span>
          </div>
        </template>

        <template #node-run="{ data }">
          <PipelineRunCard
            :task-id="data.taskId"
            :scenario-title="data.scenarioTitle"
            :status="data.status"
            :steps="data.steps"
            :active-step="data.activeStep"
            :completed-steps="data.completedSteps"
            :is-selected="data.taskId === ui.taskId"
            :claimed-by="data.claimedBy"
            :current-user-name="coworking.localUser.value.name"
            compact
            @select="onSelectRun"
            @open="onOpenRun"
            @open-browser="activeBrowserTaskId = $event"
            @gate-resolved="onGateResolved"
          />
        </template>
      </VueFlow>
    </div>

    <BrowserViewportModal
      v-if="activeBrowserTaskId"
      :task-id="activeBrowserTaskId"
      @close="activeBrowserTaskId = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { VueFlow, type Node, type Edge, type NodeDragEvent } from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { MiniMap } from "@vue-flow/minimap";
import { Controls } from "@vue-flow/controls";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/minimap/dist/style.css";
import "@vue-flow/controls/dist/style.css";

import { useUiStore } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";
import { useI18n } from "@/shared/lib/i18n";
import { isTaskActive } from "@/shared/lib/task-status";
import { useCoworking } from "@/entities/coworking/useCoworking";
import { useMultiRunItems, type MultiRunItem } from "./useMultiRunItems";
import PipelineRunCard from "@/widgets/pipeline-grid/PipelineRunCard.vue";
import BrowserViewportModal from "@/widgets/browser-viewport/BrowserViewportModal.vue";

interface PipelineRunNodeData extends MultiRunItem {
  claimedBy: string | null;
}

const ui = useUiStore();
const preferences = usePreferencesStore();
const router = useRouter();
const { t } = useI18n();
const coworking = useCoworking();
const { allRuns, recordGateResolution } = useMultiRunItems();
const activeBrowserTaskId = ref<string | null>(null);

const canvasPatternColor = computed(() => {
  return preferences.isDark ? "rgba(255, 235, 200, 0.12)" : "rgba(80, 60, 30, 0.16)";
});

const canvasBgColor = computed(() => {
  return preferences.isDark ? "#15120e" : "#f3ece0";
});

function onCanvasMouseMove(event: MouseEvent): void {
  const container = event.currentTarget as HTMLElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  coworking.sendCursor(event.clientX - rect.left, event.clientY - rect.top, "canvas");
}

const nodes = ref<Node<PipelineRunNodeData>[]>([]);
const edges = ref<Edge[]>([]);

const positionsCache = new Map<string, { x: number; y: number }>();

function createCanvasGraph(items: MultiRunItem[]): {
  newNodes: Node<PipelineRunNodeData>[];
  newEdges: Edge[];
} {
  const newNodes: Node<PipelineRunNodeData>[] = [];
  const newEdges: Edge[] = [];

  items.forEach((item, itemIndex) => {
    let position = positionsCache.get(item.taskId);
    if (!position) {
      const column = itemIndex % 3;
      const row = Math.floor(itemIndex / 3);
      position = { x: 40 + column * 360, y: 40 + row * 260 };
      positionsCache.set(item.taskId, position);
    }

    const claim = coworking.gateClaims.value.get(item.taskId);
    newNodes.push({
      id: item.taskId,
      type: "run",
      position,
      data: { ...item, claimedBy: claim ? claim.userName : null },
    });

    if (
      itemIndex > 0 &&
      isTaskActive(items[itemIndex - 1].status) &&
      isTaskActive(item.status)
    ) {
      newEdges.push({
        id: `e-${items[itemIndex - 1].taskId}-${item.taskId}`,
        source: items[itemIndex - 1].taskId,
        target: item.taskId,
        animated: true,
        style: { stroke: "var(--accent)", strokeWidth: 2 },
      });
    }
  });

  return { newNodes, newEdges };
}

// buildCanvasData rebuilds every node, so a gate resolution must be recorded in
// the run list it reads from — patching nodes.value here would be overwritten.
watch(
  () => [allRuns.value, coworking.gateClaims.value] as const,
  ([items]) => {
    const { newNodes, newEdges } = createCanvasGraph(items);
    nodes.value = newNodes;
    edges.value = newEdges;
  },
  { immediate: true, deep: false },
);

function onNodeDragStop(event: NodeDragEvent): void {
  if (event.node?.id && event.node?.position) {
    positionsCache.set(event.node.id, {
      x: event.node.position.x,
      y: event.node.position.y,
    });
  }
}

function navigateToMode(path: string): void {
  void router.push(path);
}

function onSelectRun(taskId: string): void {
  ui.taskId = taskId;
}

function onOpenRun(taskId: string): void {
  ui.taskId = taskId;
  const entry = ui.historyList.find((historyEntry) => historyEntry.taskId === taskId);
  const active = entry ? isTaskActive(entry.status ?? "") : true;
  if (active) {
    void router.push("/run/active");
  } else {
    void router.push(`/run/done/${taskId}`);
  }
}

function onGateResolved(taskId: string, approved: boolean): void {
  recordGateResolution(taskId, approved);
}
</script>

<style scoped src="./pipeline-canvas-view.css"></style>
