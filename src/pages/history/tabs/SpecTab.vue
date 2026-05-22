<template>
  <div class="spec-tab">
    <div v-if="!workspaceRoot" class="spec-tab__placeholder">
      {{ t("history.detail.spec.noWorkspace") }}
    </div>
    <div
      v-else
      class="spec-tab__layout"
      :class="{ 'spec-tab__layout--with-viewer': !!selectedSpecId }"
    >
      <div class="spec-tab__graph">
        <SpecGraphPanel
          :workspace-root="workspaceRoot"
          @node-click="emit('node-click', $event)"
        />
      </div>
      <aside v-if="selectedSpecId" class="spec-tab__viewer">
        <header class="spec-tab__viewer-head">
          <span class="spec-tab__viewer-id">{{ selectedSpecId }}</span>
          <div class="spec-tab__viewer-actions">
            <button
              v-if="!editing"
              type="button"
              class="spec-tab__btn"
              @click="emit('update:editing', true)"
            >
              {{ t("history.detail.spec.edit") }}
            </button>
            <button
              v-else
              type="button"
              class="spec-tab__btn"
              @click="emit('update:editing', false)"
            >
              {{ t("history.detail.spec.viewOnly") }}
            </button>
            <button
              type="button"
              class="spec-tab__btn"
              @click="emit('update:selected-spec-id', '')"
            >
              ×
            </button>
          </div>
        </header>
        <SpecEditorPanel :spec-id="selectedSpecId" :workspace-root="workspaceRoot" />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpecEditorPanel from "@/features/spec-editor/SpecEditorPanel.vue";
import SpecGraphPanel from "@/widgets/spec-graph-panel/SpecGraphPanel.vue";
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  workspaceRoot: string;
  selectedSpecId: string;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: "node-click", nodeId: string): void;
  (event: "update:selected-spec-id", value: string): void;
  (event: "update:editing", value: boolean): void;
}>();

const { t } = useI18n();
</script>

<style scoped>
.spec-tab {
  display: flex;
  flex-direction: column;
}

.spec-tab__placeholder {
  margin: 0;
  font-size: 12px;
  color: var(--ink-4);
}

.spec-tab__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  height: 560px;
}

.spec-tab__layout--with-viewer {
  grid-template-columns: minmax(0, 1fr) minmax(320px, 480px);
}

.spec-tab__graph {
  min-width: 0;
  min-height: 0;
  display: flex;
}

.spec-tab__graph > * {
  flex: 1 1 auto;
  min-height: 0;
}

.spec-tab__viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  min-width: 0;
}

.spec-tab__viewer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.spec-tab__viewer-id {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
}

.spec-tab__viewer-actions {
  display: flex;
  gap: 6px;
}

.spec-tab__btn {
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
  .spec-tab__layout {
    grid-template-columns: 1fr;
  }
}
</style>
