<template>
  <section class="graphs-tab">
    <nav
      class="graphs-tab__switcher"
      :aria-label="t('graphsTab.switcherAria')"
      role="tablist"
    >
      <button
        v-for="view in views"
        :key="view.key"
        type="button"
        role="tab"
        class="graphs-tab__view-btn"
        :class="{ 'graphs-tab__view-btn--active': activeView === view.key }"
        :aria-selected="activeView === view.key"
        @click="setActiveView(view.key)"
      >
        {{ view.label }}
      </button>
    </nav>

    <!-- Спецификации: spec graph + node content/editor -->
    <div v-show="activeView === 'spec'" class="graphs-tab__body">
      <p v-if="!workspaceRoot" class="graphs-tab__placeholder">
        {{ t("history.detail.spec.noWorkspace") }}
      </p>
      <div
        v-else
        class="graphs-tab__spec-layout"
        :class="{ 'graphs-tab__spec-layout--with-viewer': !!selectedSpecId }"
      >
        <div class="graphs-tab__spec-graph">
          <SpecGraphPanel
            :workspace-root="workspaceRoot"
            @node-click="onSpecNodeClick"
          />
        </div>
        <aside v-if="selectedSpecId" class="graphs-tab__spec-viewer">
          <header class="graphs-tab__spec-viewer-head">
            <span class="graphs-tab__spec-viewer-id">{{ selectedSpecId }}</span>
            <div class="graphs-tab__spec-viewer-actions">
              <button
                v-if="!editing"
                type="button"
                class="graphs-tab__btn"
                @click="editing = true"
              >
                {{ t("history.detail.spec.edit") }}
              </button>
              <button
                v-else
                type="button"
                class="graphs-tab__btn"
                @click="editing = false"
              >
                {{ t("history.detail.spec.viewOnly") }}
              </button>
              <button type="button" class="graphs-tab__btn" @click="closeSpec">
                ×
              </button>
            </div>
          </header>
          <SpecContentViewer
            :spec-id="selectedSpecId"
            :workspace-root="workspaceRoot"
          />
          <SpecEditorPanel
            v-if="editing"
            :spec-id="selectedSpecId"
            :workspace-root="workspaceRoot"
          />
        </aside>
      </div>
    </div>

    <!-- Вики-граф -->
    <div v-show="activeView === 'wiki'" class="graphs-tab__body">
      <WikiGraphPanel />
    </div>

    <!-- Граф кода -->
    <div v-show="activeView === 'code'" class="graphs-tab__body">
      <p v-if="!workspaceRoot" class="graphs-tab__placeholder">
        {{ t("history.detail.spec.noWorkspace") }}
      </p>
      <template v-else>
        <CodeGraphCanvas
          v-if="codeGraph.data.value"
          :data="codeGraph.data.value"
          @select="onSelectCodeNode"
        />
        <CodeGraphPanel
          :data="codeGraph.data.value"
          :loading="codeGraph.loading.value"
          :error="codeGraph.error.value"
          :context="codeGraphContext.context.value"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import SpecGraphPanel from "@/widgets/spec-graph-panel/SpecGraphPanel.vue";
import SpecEditorPanel from "@/features/spec-editor/SpecEditorPanel.vue";
import SpecContentViewer from "@/features/spec-editor/SpecContentViewer.vue";
import { WikiGraphPanel } from "@/widgets/wiki-graph";
import CodeGraphCanvas from "@/widgets/code-graph/CodeGraphCanvas.vue";
import CodeGraphPanel from "@/widgets/code-graph/CodeGraphPanel.vue";
import { useCodeGraph } from "@/features/code-graph/useCodeGraph";
import { useCodeGraphContext } from "@/features/code-graph/useCodeGraphContext";
import { useGraphsTab } from "./useGraphsTab";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  workspaceRoot: string;
}>();

const { t } = useI18n();

const codeGraph = useCodeGraph();
const codeGraphContext = useCodeGraphContext();

const { activeView, views, setActiveView } = useGraphsTab(t, {
  loadCodeGraph: () => void codeGraph.load(props.workspaceRoot),
});

const selectedSpecId = ref<string>("");
const editing = ref(false);

function onSpecNodeClick(nodeId: string): void {
  selectedSpecId.value = nodeId;
  editing.value = false;
}

function closeSpec(): void {
  selectedSpecId.value = "";
  editing.value = false;
}

function onSelectCodeNode(nodeId: string): void {
  void codeGraphContext.select(props.workspaceRoot, nodeId);
}

watch(
  () => props.workspaceRoot,
  () => {
    selectedSpecId.value = "";
    editing.value = false;
  },
);
</script>

<style scoped>
.graphs-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1 1 auto;
}

.graphs-tab__switcher {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}

.graphs-tab__view-btn {
  appearance: none;
  background: transparent;
  border: none;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.graphs-tab__view-btn:hover {
  color: var(--ink);
}

.graphs-tab__view-btn--active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

.graphs-tab__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1 1 auto;
}

.graphs-tab__placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

.graphs-tab__spec-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  min-height: 480px;
}

.graphs-tab__spec-layout--with-viewer {
  grid-template-columns: minmax(0, 1fr) minmax(320px, 480px);
}

.graphs-tab__spec-graph {
  min-width: 0;
  min-height: 0;
  display: flex;
}

.graphs-tab__spec-graph > * {
  flex: 1 1 auto;
  min-height: 0;
}

.graphs-tab__spec-viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  min-width: 0;
}

.graphs-tab__spec-viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.graphs-tab__spec-viewer-id {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
}

.graphs-tab__spec-viewer-actions {
  display: flex;
  gap: 6px;
}

.graphs-tab__btn {
  appearance: none;
  padding: 4px 10px;
  border-radius: var(--r-sm);
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12px;
  cursor: pointer;
}

@media (max-width: 1100px) {
  .graphs-tab__spec-layout {
    grid-template-columns: 1fr;
  }
}
</style>
