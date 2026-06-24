<template>
  <div class="agent-editor-page">
    <ScenarioToolbar />
    <div class="agent-editor-page__toolbar">
      <input
        v-model="pipeline.name"
        class="agent-editor-page__name-input"
        :placeholder="t('agentEditor.pipelineNamePlaceholder')"
      />
      <select
        v-if="savedPipelines.length"
        class="agent-editor-page__pipeline-select"
        :disabled="listLoading"
        :value="pipeline.id ?? ''"
        @change="
          (event) => handleLoadPipeline((event.target as HTMLSelectElement).value)
        "
      >
        <option value="">{{ t("agentEditor.loadPipelinePlaceholder") }}</option>
        <option v-for="entry in savedPipelines" :key="entry.id" :value="entry.id">
          {{ entry.name }}
        </option>
      </select>
      <div class="agent-editor-page__toolbar-actions">
        <button
          type="button"
          class="btn-secondary"
          :title="t('agentEditor.goToModels')"
          @click="goToAgentModels"
        >
          {{ t("agentEditor.goToModels") }}
        </button>
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? t("agentEditor.saving") : t("agentEditor.save") }}
        </button>
        <button
          v-if="pipeline.id"
          class="btn-danger"
          :disabled="listLoading"
          @click="handleDeletePipeline(pipeline.id)"
        >
          {{ t("agentEditor.delete") }}
        </button>
        <span v-if="saveError" class="agent-editor-page__save-error">{{
          saveError
        }}</span>
        <span v-if="listError" class="agent-editor-page__save-error">{{
          listError
        }}</span>
      </div>
    </div>

    <AgentEditorWorkspace
      class="agent-editor-page__body"
      :pipeline="pipeline"
      :selected-node="selectedNode"
      :callbacks="canvasCallbacks"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "@/shared/lib/i18n";
import { useEditorStore } from "@/features/agent-editor/useEditorStore";
import ScenarioToolbar from "@/features/agent-editor/ScenarioToolbar.vue";
import AgentEditorWorkspace from "./AgentEditorWorkspace.vue";

const { t } = useI18n();
const router = useRouter();

function goToAgentModels(): void {
  void router.push("/configure/models");
}

const {
  pipeline,
  selectedNode,
  saving,
  saveError,
  savedPipelines,
  listLoading,
  listError,
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  selectNode,
  savePipeline,
  refreshSavedPipelines,
  loadPipelineById,
  deletePipelineById,
} = useEditorStore();

const canvasCallbacks = {
  addNode,
  updateNode,
  removeNode,
  addEdge,
  removeEdge,
  selectNode,
};

onMounted(() => {
  void refreshSavedPipelines();
});

async function handleLoadPipeline(pipelineId: string): Promise<void> {
  await loadPipelineById(pipelineId);
}

async function handleDeletePipeline(pipelineId: string): Promise<void> {
  if (!window.confirm(t("agentEditor.confirmDelete"))) return;
  await deletePipelineById(pipelineId);
}

async function handleSave(): Promise<void> {
  await savePipeline();
}
</script>

<style scoped>
.agent-editor-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
}
.agent-editor-page__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border, #2a2f3e);
  background: var(--bg2, #1e2230);
}
.agent-editor-page__name-input {
  flex: 1;
  max-width: 280px;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-size: 13px;
  font-weight: 600;
}
.agent-editor-page__toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.agent-editor-page__save-error {
  font-size: 11px;
  color: var(--error, #f03e3e);
}
.agent-editor-page__body {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
