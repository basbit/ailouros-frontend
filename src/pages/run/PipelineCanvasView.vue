<template>
  <div class="pipeline-canvas-view">
    <div class="pipeline-canvas-view__toolbar">
      <div class="pipeline-canvas-view__title-group">
        <h2 class="pipeline-canvas-view__title">
          {{ t("pipelineCard.parallelPipes") }} (2D Canvas)
        </h2>
        <span class="pipeline-canvas-view__count-badge">{{ nodes.length }} nodes</span>
      </div>

      <!-- View Mode Switcher -->
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

    <!-- 2D Spatial Infinite Canvas -->
    <div class="pipeline-canvas-view__canvas-container" @mousemove="onCanvasMouseMove">
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 0.9 }"
        fit-view-on-init
        @node-drag-stop="onNodeDragStop"
      >
        <!-- Default Slot: Canvas Addons & Remote Coworking Peer Cursors -->
        <template #default>
          <Background :gap="20" color="rgba(255, 255, 255, 0.05)" />
          <MiniMap />
          <Controls />

          <div
            v-for="peer in activeRemotePeers"
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

        <!-- Custom Node Template for Swarm Pipeline Run -->
        <template #node-run="{ data }">
          <PipelineRunCard
            :task-id="data.taskId"
            :scenario-title="data.scenarioTitle"
            :status="data.status"
            :active-step="data.activeStep"
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

    <!-- Quick Live Browser Modal -->
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
import { useI18n } from "@/shared/lib/i18n";
import { isTaskActive } from "@/shared/lib/task-status";
import { useCoworking, type RemotePeer } from "@/features/coworking/useCoworking";
import PipelineRunCard from "@/widgets/pipeline-grid/PipelineRunCard.vue";
import BrowserViewportModal from "@/widgets/browser-viewport/BrowserViewportModal.vue";

const props = defineProps<{
  remotePeers?: RemotePeer[];
}>();

export interface PipelineRunNodeData {
  taskId: string;
  scenarioTitle: string | null;
  status: string;
  activeStep: string | null;
  claimedBy?: string | null;
}

const ui = useUiStore();
const router = useRouter();
const { t } = useI18n();
const coworking = useCoworking();
const activeBrowserTaskId = ref<string | null>(null);

const activeRemotePeers = computed<RemotePeer[]>(() => {
  return props.remotePeers?.length ? props.remotePeers : coworking.peers.value;
});

function onCanvasMouseMove(event: MouseEvent): void {
  const container = event.currentTarget as HTMLElement;
  if (!container) return;
  const rect = container.getBoundingClientRect();
  coworking.sendCursor(event.clientX - rect.left, event.clientY - rect.top, "canvas");
}

const nodes = ref<Node<PipelineRunNodeData>[]>([]);
const edges = ref<Edge[]>([]);

// Node position cache to preserve user positioning during re-renders
const positionsCache = new Map<string, { x: number; y: number }>();

function mergeHistoryRuns(
  historyList: typeof ui.historyList,
  map: Map<string, PipelineRunNodeData>,
): void {
  for (const entry of historyList) {
    const entryTaskId = entry.taskId;
    if (!entryTaskId) continue;
    const title = (entry as Record<string, unknown>).scenarioTitle
      ? String((entry as Record<string, unknown>).scenarioTitle)
      : entry.prompt || null;
    const existing = map.get(entryTaskId);
    if (existing) {
      if (title) existing.scenarioTitle = title;
      if (entry.status) existing.status = String(entry.status);
    } else {
      map.set(entryTaskId, {
        taskId: entryTaskId,
        scenarioTitle: title,
        status: entry.status ? String(entry.status) : "completed",
        activeStep: null,
      });
    }
  }
}

function collectCanvasRunItems(): PipelineRunNodeData[] {
  const map = new Map<string, PipelineRunNodeData>();

  if (ui.taskId) {
    map.set(ui.taskId, {
      taskId: ui.taskId,
      scenarioTitle: ui.taskScenarioTitle,
      status: String(ui.taskStatus ?? "running"),
      activeStep: ui.activeStep,
    });
  }

  for (const identifier of ui.activeRunIds ?? []) {
    if (!map.has(identifier)) {
      map.set(identifier, {
        taskId: identifier,
        scenarioTitle: null,
        status:
          identifier === ui.taskId ? String(ui.taskStatus ?? "running") : "in_progress",
        activeStep: null,
      });
    }
  }

  mergeHistoryRuns(ui.historyList, map);
  return Array.from(map.values());
}

function createCanvasGraph(items: PipelineRunNodeData[]): {
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
      data: {
        taskId: item.taskId,
        scenarioTitle: item.scenarioTitle,
        status: item.status,
        activeStep: item.activeStep,
        claimedBy: claim ? claim.userName : (item.claimedBy ?? null),
      },
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
        style: { stroke: "#6366f1", strokeWidth: 2 },
      });
    }
  });

  return { newNodes, newEdges };
}

function buildCanvasData(): void {
  const items = collectCanvasRunItems();
  const { newNodes, newEdges } = createCanvasGraph(items);
  nodes.value = newNodes;
  edges.value = newEdges;
}

watch(
  () => [
    ui.taskId,
    ui.taskStatus,
    ui.activeRunIds?.length,
    ui.historyList.length,
    coworking.gateClaims.value.size,
  ],
  () => {
    buildCanvasData();
  },
  { immediate: true },
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
  for (const node of nodes.value) {
    if (node.id === taskId && node.data) {
      node.data.status = approved ? "in_progress" : "blocked";
      break;
    }
  }
  if (ui.taskId === taskId) {
    ui.humanGateVisible = false;
    ui.taskStatus = approved ? "in_progress" : "blocked";
  }
}
</script>

<style scoped src="./pipeline-canvas-view.css"></style>
