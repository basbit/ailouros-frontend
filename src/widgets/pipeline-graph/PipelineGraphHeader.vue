<template>
  <div class="pg-header">
    <div class="pg-header__row">
      <span class="pg-header__label">{{ t("graph.scenarioLabel") }}:</span>
      <div class="pg-header__chips">
        <button
          v-for="entry in scenarioChips"
          :key="entry.id"
          type="button"
          class="pg-header__chip"
          :class="{ 'pg-header__chip--active': entry.id === activeId }"
          :title="entry.description"
          :disabled="props.disabled"
          @click="onPickChip(entry.id)"
        >
          {{ entry.title }}
        </button>
        <button
          type="button"
          class="pg-header__chip pg-header__chip--custom"
          :class="{ 'pg-header__chip--active': isCustomActive }"
          :disabled="props.disabled"
          @click="onPickChip(CUSTOM_ID)"
        >
          ⚙ {{ t("graph.customScenario") }}
        </button>
        <select
          v-if="props.customScenarios.length"
          class="pg-header__custom-select"
          :value="props.activeCustomScenarioId ?? ''"
          :disabled="props.disabled"
          :title="t('graph.customScenarioSelect')"
          @change="onPickCustom"
        >
          <option value="">{{ t("graph.customScenarioCurrent") }}</option>
          <option
            v-for="scenario in props.customScenarios"
            :key="scenario.id"
            :value="scenario.id"
          >
            {{ scenario.title }}
          </option>
        </select>
        <button
          type="button"
          class="pg-header__copy"
          :disabled="props.disabled || !isCustomActive"
          :title="t('graph.saveCustomScenarioTitle')"
          @click="onSaveCustom"
        >
          {{ t("graph.saveCustomScenario") }}
        </button>
      </div>
      <button
        v-if="!isCustomActive"
        type="button"
        class="pg-header__copy"
        :disabled="props.disabled"
        :title="t('graph.copyToCustomTitle')"
        @click="onCopyToCustom"
      >
        {{ t("graph.copyToCustom") }}
      </button>
    </div>

    <div class="pg-header__badges">
      <span
        class="pg-header__badge"
        :class="
          props.workspaceWrite ? 'pg-header__badge--write' : 'pg-header__badge--read'
        "
      >
        {{
          props.workspaceWrite ? t("graph.badges.writes") : t("graph.badges.readonly")
        }}
      </span>
      <span class="pg-header__badge">
        {{ t("graph.badges.steps", { n: props.stepCount }) }}
      </span>
      <span
        v-for="gate in props.gates"
        :key="`gate-${gate}`"
        class="pg-header__badge pg-header__badge--gate"
      >
        {{ gate }}
      </span>
      <span
        v-for="tool in props.tools"
        :key="`tool-${tool}`"
        class="pg-header__badge"
        :class="{ 'pg-header__badge--warn': props.warningTools.includes(tool) }"
        :title="props.warningTools.includes(tool) ? t('graph.badges.toolWarn') : ''"
      >
        {{ tool
        }}<span v-if="props.warningTools.includes(tool)" class="pg-header__warn"
          >!</span
        >
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  scenarioDescription,
  scenarioTitle,
  useScenarioCatalog,
} from "@/features/scenario-picker";
import type { CustomScenarioSnap } from "@/shared/model/project-types";

const CUSTOM_ID = "__custom__";

const props = withDefaults(
  defineProps<{
    activeId: string;
    stepCount: number;
    workspaceWrite: boolean;
    gates: string[];
    tools: string[];
    warningTools: string[];
    customScenarios: CustomScenarioSnap[];
    activeCustomScenarioId?: string | null;
    disabled?: boolean;
  }>(),
  { activeCustomScenarioId: null, customScenarios: () => [], disabled: false },
);

const emit = defineEmits<{
  "update:activeId": [value: string];
  "copy-to-custom": [];
  "select-custom": [scenarioId: string];
  "save-custom": [];
}>();

const { t } = useI18n();
const catalog = useScenarioCatalog();

const isCustomActive = computed(() => !props.activeId || props.activeId === CUSTOM_ID);

const scenarioChips = computed(() => {
  const items = catalog.scenarios.value.map((scenario) => ({
    id: scenario.id,
    title: scenarioTitle(scenario, t),
    description: scenarioDescription(scenario, t),
  }));
  items.sort((left, right) => left.title.localeCompare(right.title));
  return items;
});

function onPickChip(id: string): void {
  emit("update:activeId", id);
}

function onCopyToCustom(): void {
  emit("copy-to-custom");
}

function onPickCustom(event: Event): void {
  const target = event.target as HTMLSelectElement | null;
  emit("select-custom", target?.value ?? "");
}

function onSaveCustom(): void {
  emit("save-custom");
}
</script>

<style scoped>
.pg-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 0 10px;
  border-bottom: 1px solid var(--border, #333);
  margin-bottom: 8px;
}
.pg-header__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.pg-header__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  font-weight: 600;
}
.pg-header__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1 1 auto;
}
.pg-header__chip {
  font-size: 11px;
  padding: 4px 10px;
  background: transparent;
  color: var(--text2, #a8b0c4);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}
.pg-header__chip:hover {
  color: var(--text, #f5f0e7);
  border-color: var(--accent, #3b5bdb);
}
.pg-header__chip--active {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-color: var(--accent, #3b5bdb);
}
.pg-header__chip-star {
  color: #f5b740;
  font-size: 10px;
}
.pg-header__chip--custom {
  border-style: dashed;
}
.pg-header__custom-select {
  min-width: 150px;
  max-width: 220px;
  font-size: 11px;
  padding: 4px 26px 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface, #1a1d29);
  color: var(--text, #f5f0e7);
}
.pg-header__copy {
  font-size: 10px;
  padding: 4px 10px;
  background: transparent;
  color: var(--text2, #a8b0c4);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}
.pg-header__copy:hover {
  color: var(--text, #f5f0e7);
  border-color: var(--accent, #3b5bdb);
}
.pg-header__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pg-header__badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  color: var(--text2, #a8b0c4);
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.pg-header__badge--write {
  background: color-mix(in srgb, #d7563f 25%, transparent);
  color: var(--text, #f5f0e7);
}
.pg-header__badge--read {
  background: color-mix(in srgb, #3b5bdb 25%, transparent);
  color: var(--text, #f5f0e7);
}
.pg-header__badge--gate {
  background: color-mix(in srgb, #f5b740 25%, transparent);
  color: var(--text, #f5f0e7);
}
.pg-header__badge--warn {
  background: color-mix(in srgb, #d7563f 35%, transparent);
  color: var(--text, #f5f0e7);
}
.pg-header__warn {
  font-weight: 700;
}
</style>
