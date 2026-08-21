<template>
  <section class="spec-graph-panel">
    <header class="spec-graph-panel__head">
      <h3 class="spec-graph-panel__title">Spec Graph</h3>
      <div class="spec-graph-panel__head-right">
        <span v-if="nodes.length" class="spec-graph-panel__count">
          {{ nodes.length }} nodes · {{ edges.length }} edges
        </span>
        <button
          type="button"
          class="spec-graph-panel__refresh"
          :disabled="loading"
          @click="reload"
        >
          ↻
        </button>
      </div>
    </header>

    <div class="spec-graph-panel__legend">
      <span
        v-for="entry in legendEntries"
        :key="entry.kind"
        class="spec-graph-panel__legend-item"
      >
        <span
          class="spec-graph-panel__legend-dot"
          :style="{ background: entry.color }"
        />
        {{ entry.kind }}
      </span>
    </div>

    <div class="spec-graph-panel__viewport">
      <div v-if="loading" class="spec-graph-panel__state">Loading…</div>
      <div
        v-else-if="notImplemented"
        class="spec-graph-panel__state spec-graph-panel__state--hint"
      >
        Spec graph endpoint not available yet.
      </div>
      <div
        v-else-if="error"
        class="spec-graph-panel__state spec-graph-panel__state--error"
      >
        {{ error }}
      </div>
      <div v-else-if="!data || !data.nodes.length" class="spec-graph-panel__state">
        No spec graph for this workspace yet.
      </div>
      <GraphCanvas v-else :data="data" :search="search" @node-click="onNodeClick" />
    </div>

    <div class="spec-graph-panel__controls">
      <input
        v-model="search"
        class="spec-graph-panel__search"
        type="search"
        :placeholder="t('specGraph.filterPlaceholder')"
      />
      <button type="button" class="spec-graph-panel__toggle" @click="toggleOrphans">
        {{ t("specGraph.orphans") }}
      </button>
    </div>

    <div v-if="relationsVisible" class="spec-graph-panel__relations">
      <h4 class="spec-graph-panel__relations-title">{{ selectedNodeId }}</h4>
      <div class="spec-graph-panel__relations-group">
        <strong>{{ t("specGraph.ancestors") }}</strong>
        <span v-if="!ancestors.length" class="spec-graph-panel__relations-empty">
          —
        </span>
        <ul v-else class="spec-graph-panel__relations-list">
          <li v-for="item in ancestors" :key="item">{{ item }}</li>
        </ul>
      </div>
      <div class="spec-graph-panel__relations-group">
        <strong>{{ t("specGraph.dependants") }}</strong>
        <span v-if="!dependants.length" class="spec-graph-panel__relations-empty">
          —
        </span>
        <ul v-else class="spec-graph-panel__relations-list">
          <li v-for="item in dependants" :key="item">{{ item }}</li>
        </ul>
      </div>
    </div>

    <div v-if="orphansVisible" class="spec-graph-panel__orphans">
      <h4 class="spec-graph-panel__relations-title">{{ t("specGraph.orphans") }}</h4>
      <span v-if="!orphans.length" class="spec-graph-panel__relations-empty">—</span>
      <ul v-else class="spec-graph-panel__relations-list">
        <li v-for="item in orphans" :key="item">{{ item }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { GraphCanvas } from "@/features/graph-canvas";
import { useI18n } from "@/shared/lib/i18n";
import { SPEC_NODE_PALETTE, useSpecGraph } from "./useSpecGraph";
const props = withDefaults(
  defineProps<{
    workspaceRoot?: string;
    persist?: boolean;
    autoLoad?: boolean;
  }>(),
  { workspaceRoot: "", persist: false, autoLoad: true },
);

const emit = defineEmits<{ nodeClick: [nodeId: string] }>();

const {
  nodes,
  edges,
  data,
  loading,
  error,
  notImplemented,
  load,
  ancestors,
  dependants,
  orphans,
  loadNodeRelations,
  loadOrphans,
  clearRelations,
} = useSpecGraph();
const search = ref("");
const selectedNodeId = ref("");
const showOrphans = ref(false);

const relationsVisible = computed(() => selectedNodeId.value.length > 0);
const orphansVisible = computed(() => showOrphans.value);

const { t } = useI18n();

const legendEntries = computed(() =>
  Object.entries(SPEC_NODE_PALETTE).map(([kind, color]) => ({ kind, color })),
);

async function reload(): Promise<void> {
  await load(props.workspaceRoot, props.persist);
  if (props.workspaceRoot && showOrphans.value) {
    await loadOrphans(props.workspaceRoot);
  }
}

function onNodeClick(nodeId: string): void {
  selectedNodeId.value = nodeId;
  if (nodeId && props.workspaceRoot) {
    void loadNodeRelations(props.workspaceRoot, nodeId);
  }
  emit("nodeClick", nodeId);
}

function toggleOrphans(): void {
  showOrphans.value = !showOrphans.value;
  if (showOrphans.value && props.workspaceRoot) {
    void loadOrphans(props.workspaceRoot);
  } else if (!showOrphans.value) {
    orphans.value = [];
  }
}

onMounted(() => {
  if (props.autoLoad) void reload();
});

watch(
  () => props.workspaceRoot,
  () => {
    selectedNodeId.value = "";
    clearRelations();
    if (props.autoLoad) void reload();
  },
);
</script>

<style scoped>
.spec-graph-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid var(--border, #e2e2e6);
  border-radius: 8px;
  padding: 12px;
  background: var(--surface, transparent);
}
.spec-graph-panel__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.spec-graph-panel__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.spec-graph-panel__head-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.spec-graph-panel__count {
  font-size: 11px;
  color: var(--text2, #888);
}
.spec-graph-panel__refresh {
  background: transparent;
  border: 1px solid var(--border, #d4d4d8);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.spec-graph-panel__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.spec-graph-panel__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 11px;
  color: var(--text2, #888);
}
.spec-graph-panel__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.spec-graph-panel__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.spec-graph-panel__viewport {
  position: relative;
  min-height: 320px;
  height: 50vh;
  border: 1px solid var(--border, #e2e2e6);
  border-radius: 6px;
  background: var(--bg, transparent);
  overflow: hidden;
}
.spec-graph-panel__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
  color: var(--text2, #888);
  padding: 16px;
  text-align: center;
}
.spec-graph-panel__state--error {
  color: var(--error, #c0392b);
}
.spec-graph-panel__state--hint {
  font-style: italic;
}
.spec-graph-panel__controls {
  display: flex;
  gap: 8px;
}
.spec-graph-panel__search {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border, #d4d4d8);
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg, transparent);
  color: inherit;
}

.spec-graph-panel__toggle {
  flex-shrink: 0;
  padding: 4px 10px;
  border: 1px solid var(--border, #d4d4d8);
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg, transparent);
  color: inherit;
  cursor: pointer;
}

.spec-graph-panel__relations,
.spec-graph-panel__orphans {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border, #e2e2e6);
  border-radius: 6px;
  font-size: 12px;
}

.spec-graph-panel__relations-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-mono, monospace);
  color: var(--text1, inherit);
}

.spec-graph-panel__relations-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spec-graph-panel__relations-empty {
  color: var(--text2, #888);
}

.spec-graph-panel__relations-list {
  margin: 0;
  padding-left: 16px;
  max-height: 120px;
  overflow-y: auto;
}

.spec-graph-panel__relations-list li {
  font-family: var(--font-mono, monospace);
  font-size: 11px;
}
</style>
