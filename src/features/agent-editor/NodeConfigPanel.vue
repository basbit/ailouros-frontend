<template>
  <div class="node-config">
    <div class="node-config__type-badge" :style="{ background: typeColor }">
      {{ node.type }}
    </div>

    <template v-if="node.type === 'agent'">
      <label class="node-config__label">{{ t("agentEditor.config.name") }}</label>
      <input
        class="node-config__input"
        :value="agentCfg.name"
        @input="patch('name', inputVal($event))"
      />

      <label class="node-config__label">{{ t("agentEditor.config.model") }}</label>
      <input
        class="node-config__input"
        :value="agentCfg.model"
        @input="patch('model', inputVal($event))"
      />

      <label class="node-config__label">{{ t("agentEditor.config.role") }}</label>
      <input
        class="node-config__input"
        :value="agentCfg.role"
        :placeholder="t('agentEditor.config.rolePlaceholder')"
        @input="patch('role', inputVal($event))"
      />

      <label class="node-config__label">{{ t("agentEditor.config.promptPath") }}</label>
      <div class="node-config__prompt-row">
        <PromptPathPicker
          :model-value="agentCfg.promptPath ?? ''"
          @update:model-value="(value) => patch('promptPath', value)"
        />
        <button
          type="button"
          class="node-config__edit-prompt"
          :title="t('promptEditor.openLabel')"
          :aria-label="t('promptEditor.openLabel')"
          @click="openPromptEditor"
        >
          {{ t("promptEditor.openLabel") }}
        </button>
      </div>

      <label class="node-config__label">{{
        t("agentEditor.config.promptInline")
      }}</label>
      <textarea
        class="node-config__textarea"
        :value="agentCfg.promptInline ?? ''"
        :placeholder="t('agentEditor.config.promptInlinePlaceholder')"
        @input="patch('promptInline', inputVal($event))"
      />

      <label class="node-config__label">{{ t("agentEditor.config.maxSteps") }}</label>
      <input
        class="node-config__input"
        type="number"
        :value="agentCfg.maxSteps"
        min="1"
        max="50"
        @input="patch('maxSteps', parseInt(inputVal($event)) || 10)"
      />
    </template>

    <template v-else-if="node.type === 'trigger'">
      <label class="node-config__label">{{
        t("agentEditor.config.triggerType")
      }}</label>
      <select
        class="node-config__select"
        :value="triggerCfg.triggerType"
        @change="patch('triggerType', inputVal($event))"
      >
        <option value="manual">manual</option>
        <option value="webhook">webhook</option>
        <option value="cron">cron</option>
      </select>
      <template v-if="triggerCfg.triggerType === 'cron'">
        <label class="node-config__label">{{ t("agentEditor.config.cronExpr") }}</label>
        <input
          class="node-config__input"
          :value="triggerCfg.cronExpr ?? ''"
          @input="patch('cronExpr', inputVal($event))"
        />
      </template>
    </template>

    <template v-else-if="node.type === 'condition'">
      <label class="node-config__label">{{ t("agentEditor.config.fieldPath") }}</label>
      <input
        class="node-config__input"
        :value="conditionCfg.fieldPath"
        @input="patch('fieldPath', inputVal($event))"
      />
      <label class="node-config__label">{{ t("agentEditor.config.operator") }}</label>
      <select
        class="node-config__select"
        :value="conditionCfg.operator"
        @change="patch('operator', inputVal($event))"
      >
        <option value="==">==</option>
        <option value="!=">!=</option>
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
        <option value="contains">contains</option>
      </select>
      <label class="node-config__label">{{ t("agentEditor.config.value") }}</label>
      <input
        class="node-config__input"
        :value="conditionCfg.value"
        @input="patch('value', inputVal($event))"
      />
    </template>

    <div v-else class="node-config__no-config">
      {{ t("agentEditor.config.noConfig") }}
    </div>
  </div>
  <PromptEditorDialog
    :open="promptEditorOpen"
    :initial-path="agentCfg.promptPath ?? ''"
    @close="promptEditorOpen = false"
    @saved="onPromptSaved"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import PromptPathPicker from "@/shared/components/PromptPathPicker.vue";
import PromptEditorDialog from "@/shared/components/PromptEditorDialog.vue";
import type {
  PipelineNode,
  AgentConfig,
  TriggerConfig,
  ConditionConfig,
} from "./types";

const props = defineProps<{ node: PipelineNode }>();
const emit = defineEmits<{ update: [patch: Partial<PipelineNode>] }>();
const { t } = useI18n();

const NODE_COLORS: Record<string, string> = {
  trigger: "#868e96",
  agent: "#4dabf7",
  tool: "#51cf66",
  condition: "#ffd43b",
  aggregator: "#cc5de8",
  output: "#495057",
};
const typeColor = computed(() => NODE_COLORS[props.node.type] ?? "#4a5578");

const agentCfg = computed(() => props.node.config as AgentConfig);
const triggerCfg = computed(() => props.node.config as TriggerConfig);
const conditionCfg = computed(() => props.node.config as ConditionConfig);

function inputVal(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
    .value;
}

function patch(key: string, value: unknown): void {
  emit("update", { config: { ...props.node.config, [key]: value } });
}

const promptEditorOpen = ref(false);

function openPromptEditor(): void {
  promptEditorOpen.value = true;
}

function onPromptSaved(path: string): void {
  patch("promptPath", path);
  promptEditorOpen.value = false;
}
</script>

<style scoped>
.node-config {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.node-config__type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
  align-self: flex-start;
  margin-bottom: 4px;
}
.node-config__label {
  font-size: 10px;
  color: var(--text2, #9dadd0);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.node-config__input,
.node-config__select {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-size: 12px;
  width: 100%;
}
.node-config__textarea {
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--bg, #161922);
  color: var(--text1, #c8cfe8);
  font-size: 12px;
  width: 100%;
  min-height: 80px;
  resize: vertical;
}
.node-config__no-config {
  font-size: 11px;
  color: var(--text2, #9dadd0);
  font-style: italic;
}
.node-config__prompt-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.node-config__edit-prompt {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: 1px solid var(--accent, #3b5bdb);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}
</style>
