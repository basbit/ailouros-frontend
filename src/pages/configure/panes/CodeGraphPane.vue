<template>
  <section class="code-graph-pane">
    <PaneHeader
      :title="t('configure.subnav.codeGraph')"
      :subtitle="t('configure.codeGraph.subtitle')"
    />
    <div class="cg-actions">
      <button type="button" :disabled="loading" @click="reload">
        {{ t("configure.codeGraph.reload") }}
      </button>
      <span class="cg-workspace">
        {{ workspaceRoot || t("configure.codeGraph.noWorkspace") }}
      </span>
    </div>
    <CodeGraphFlow v-if="data" :data="data" @select="onSelect" />
    <CodeGraphPanel :data="data" :loading="loading" :error="error" :context="context" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";

import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import CodeGraphPanel from "@/widgets/code-graph/CodeGraphPanel.vue";
import CodeGraphFlow from "@/widgets/code-graph/CodeGraphFlow.vue";
import { useCodeGraph } from "@/features/code-graph/useCodeGraph";
import { useCodeGraphContext } from "@/features/code-graph/useCodeGraphContext";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const settings = useInjectedAppSettings();
const { data, loading, error, load } = useCodeGraph();
const { context, select, clear } = useCodeGraphContext();

const workspaceRoot = computed(() => settings.form.workspace_root ?? "");

function reload(): void {
  clear();
  void load(workspaceRoot.value);
}

function onSelect(nodeId: string): void {
  void select(workspaceRoot.value, nodeId);
}

onMounted(() => {
  void load(workspaceRoot.value);
});
</script>

<style scoped>
.code-graph-pane {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cg-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.cg-workspace {
  font-family: monospace;
  font-size: 0.85em;
  opacity: 0.75;
}
</style>
