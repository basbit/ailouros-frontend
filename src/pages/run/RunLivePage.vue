<template>
  <div class="run-live">
    <AppHeaderContainer />
    <main class="run-live__body">
      <nav
        v-if="hasRun"
        class="run-live__tabs"
        :aria-label="t('history.detail.tabsAria')"
      >
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="run-live__tab"
          :class="{ 'run-live__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </nav>

      <RunLiveBody v-show="!hasRun || activeTab === 'run'" />
      <ToolActivityPanel
        v-if="hasRun && activeTab === 'activity'"
        :task-id="ui.taskId"
      />
      <RunArtifactsTab v-else-if="hasRun && activeTab === 'artifacts'" />
      <TokensTab v-else-if="hasRun && activeTab === 'tokens'" :task-id="ui.taskId" />
      <GraphsTab
        v-else-if="hasRun && activeTab === 'graphs'"
        :workspace-root="workspaceRootForRun"
      />
      <VisualTab v-else-if="hasRun && activeTab === 'visual'" :task-id="ui.taskId" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import AppHeaderContainer from "@/widgets/header/AppHeaderContainer.vue";
import RunLiveBody from "./RunLiveBody.vue";
import RunArtifactsTab from "./RunArtifactsTab.vue";
import GraphsTab from "@/pages/history/tabs/GraphsTab.vue";
import TokensTab from "@/pages/history/tabs/TokensTab.vue";
import VisualTab from "@/pages/history/tabs/VisualTab.vue";
import { ToolActivityPanel } from "@/widgets/tool-activity-panel";
import { useHistoryDetailTabs } from "@/pages/history/useHistoryDetailTabs";
import { useUiStore } from "@/shared/store/ui";
import { useI18n } from "@/shared/lib/i18n";
import { useRunLiveSubscription } from "./useRunLiveSubscription";

const ui = useUiStore();
const { t } = useI18n();
useRunLiveSubscription(ui);

const { activeTab, tabs } = useHistoryDetailTabs(t);

const hasRun = computed(() => !!ui.taskId && ui.runAvailability !== "unavailable");

const workspaceRootForRun = computed<string>(() => {
  const entry = ui.historyList.find((item) => item.taskId === ui.taskId);
  return (entry?.workspace_root ?? "").trim();
});
</script>

<style scoped>
.run-live {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
}

.run-live__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 24px 32px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.run-live__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--line);
}

.run-live__tab {
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

.run-live__tab:hover {
  color: var(--ink);
}

.run-live__tab--active {
  color: var(--ink);
  border-bottom-color: var(--accent);
}
</style>
