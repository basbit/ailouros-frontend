<template>
  <section class="spec-editor">
    <header class="spec-editor__head">
      <h2 class="spec-editor__title">Spec Editor</h2>
      <code v-if="specId" class="spec-editor__id">{{ specId }}</code>
    </header>

    <nav v-if="hasExtensionTabs" class="spec-editor__tabs">
      <button
        type="button"
        :class="['spec-editor__tab', { active: activeTab === 'editor' }]"
        @click="activeTab = 'editor'"
      >
        Editor
      </button>
      <button
        v-if="hasGraphSlot"
        type="button"
        :class="['spec-editor__tab', { active: activeTab === 'graph' }]"
        @click="activeTab = 'graph'"
      >
        Graph
      </button>
      <button
        v-if="hasDriftSlot"
        type="button"
        :class="['spec-editor__tab', { active: activeTab === 'drift' }]"
        @click="activeTab = 'drift'"
      >
        Drift
      </button>
    </nav>

    <div v-show="activeTab === 'editor'" class="spec-editor__grid">
      <div class="spec-editor__slot spec-editor__slot--requirements">
        <slot name="requirements">
          <RequirementsTable :requirements="requirements" />
        </slot>
      </div>
      <div class="spec-editor__slot spec-editor__slot--decisions">
        <slot name="decisions">
          <DesignDecisionsTree :decisions="decisions" />
        </slot>
      </div>
      <div class="spec-editor__slot spec-editor__slot--tasks">
        <slot name="tasks">
          <TaskKanban :tasks="tasks" />
        </slot>
      </div>
      <div class="spec-editor__slot spec-editor__slot--validator">
        <slot name="validator">
          <SpecValidator
            :spec-id="specId"
            :initial="initialValidation"
            :auto-fetch="autoFetchValidation"
          />
        </slot>
      </div>
    </div>

    <div v-if="hasGraphSlot" v-show="activeTab === 'graph'" class="spec-editor__panel">
      <slot name="graph" />
    </div>
    <div v-if="hasDriftSlot" v-show="activeTab === 'drift'" class="spec-editor__panel">
      <slot name="drift" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from "vue";
import RequirementsTable from "./RequirementsTable.vue";
import DesignDecisionsTree from "./DesignDecisionsTree.vue";
import TaskKanban from "./TaskKanban.vue";
import SpecValidator from "./SpecValidator.vue";
import type {
  DesignDecision,
  Requirement,
  SpecTask,
  SpecValidationResult,
} from "./spec-types";

type EditorTab = "editor" | "graph" | "drift";

withDefaults(
  defineProps<{
    specId?: string | null;
    requirements?: Requirement[];
    decisions?: DesignDecision[];
    tasks?: SpecTask[];
    initialValidation?: SpecValidationResult | null;
    autoFetchValidation?: boolean;
  }>(),
  {
    specId: null,
    requirements: () => [],
    decisions: () => [],
    tasks: () => [],
    initialValidation: null,
    autoFetchValidation: true,
  },
);

const slots = useSlots();
const hasGraphSlot = computed(() => Boolean(slots.graph));
const hasDriftSlot = computed(() => Boolean(slots.drift));
const hasExtensionTabs = computed(() => hasGraphSlot.value || hasDriftSlot.value);
const activeTab = ref<EditorTab>("editor");
</script>

<style scoped>
.spec-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}
.spec-editor__head {
  display: flex;
  gap: 12px;
  align-items: baseline;
}
.spec-editor__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.spec-editor__id {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #666;
  font-size: 12px;
}
.spec-editor__tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border, #e2e2e6);
}
.spec-editor__tab {
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text2, #666);
  border-radius: 4px 4px 0 0;
}
.spec-editor__tab.active {
  background: var(--surface, #fff);
  border-color: var(--border, #e2e2e6);
  color: var(--text, #111);
  font-weight: 600;
  position: relative;
  top: 1px;
}
.spec-editor__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.spec-editor__slot--tasks,
.spec-editor__slot--validator {
  grid-column: span 1;
}
.spec-editor__panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
@media (max-width: 900px) {
  .spec-editor__grid {
    grid-template-columns: 1fr;
  }
}
</style>
