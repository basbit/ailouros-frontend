<template>
  <section class="scenario-picker">
    <header class="scenario-picker__head">
      <span class="scenario-picker__title">{{ t("scenarios.title") }}</span>
      <button
        v-if="props.modelValue"
        type="button"
        class="scenario-picker__clear"
        :disabled="props.disabled"
        @click="onClear"
      >
        {{ t("scenarios.clear") }}
      </button>
    </header>

    <div v-if="catalog.loading.value" class="scenario-picker__status">
      {{ t("scenarios.loading") }}
    </div>
    <div v-else-if="catalog.error.value" class="scenario-picker__error">
      {{ t("scenarios.error", { error: catalog.error.value }) }}
    </div>
    <template v-else>
      <div v-if="categoryTabs.length" class="scenario-picker__tabs">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          type="button"
          class="scenario-picker__tab"
          :class="{ 'is-active': tab.id === activeTab }"
          :disabled="props.disabled"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span class="scenario-picker__tab-count">{{ tab.count }}</span>
        </button>
      </div>

      <div v-if="favoriteScenarios.length" class="scenario-picker__section">
        <div class="scenario-picker__section-label">{{ t("scenarios.favorites") }}</div>
        <div class="scenario-picker__list">
          <ScenarioCard
            v-for="item in favoriteScenarios"
            :key="`fav-${item.id}`"
            :scenario="item"
            :title="scenarioTitle(item, t)"
            :description="shortScenarioDescription(item, t)"
            :selected="item.id === props.modelValue"
            :favorite="true"
            :disabled="props.disabled"
            :selected-label="t('scenarios.selected')"
            :favorite-label="t('scenarios.unfavorite')"
            :write-on-label="t('scenarios.card.workspaceWriteOn')"
            :write-off-label="t('scenarios.card.workspaceWriteOff')"
            :steps-label="t('scenarios.card.steps', { n: item.pipeline_steps.length })"
            @pick="onPick(item)"
            @toggle-favorite="emit('toggle-favorite', item.id)"
          />
        </div>
      </div>

      <div class="scenario-picker__list">
        <button
          type="button"
          class="scenario-picker__card scenario-picker__card--none"
          :class="{ 'is-selected': props.modelValue === null }"
          :disabled="props.disabled"
          @click="onPickNone"
        >
          <span class="scenario-picker__card-title">{{ t("scenarios.none") }}</span>
          <span v-if="props.modelValue === null" class="scenario-picker__pill">
            {{ t("scenarios.selected") }}
          </span>
        </button>

        <ScenarioCard
          v-for="item in visibleScenarios"
          :key="item.id"
          :scenario="item"
          :title="scenarioTitle(item, t)"
          :description="shortScenarioDescription(item, t)"
          :selected="item.id === props.modelValue"
          :favorite="isFavorite(item.id)"
          :disabled="props.disabled"
          :selected-label="t('scenarios.selected')"
          :favorite-label="
            isFavorite(item.id) ? t('scenarios.unfavorite') : t('scenarios.favorite')
          "
          :write-on-label="t('scenarios.card.workspaceWriteOn')"
          :write-off-label="t('scenarios.card.workspaceWriteOff')"
          :steps-label="t('scenarios.card.steps', { n: item.pipeline_steps.length })"
          @pick="onPick(item)"
          @toggle-favorite="emit('toggle-favorite', item.id)"
        />
      </div>

      <ScenarioEstimatePanel
        v-if="props.modelValue"
        :estimate="estimate.estimate.value"
        :loading="estimate.loading.value"
        :error="estimate.error.value"
        :not-implemented="estimate.notImplemented.value"
        :skip-gates="props.skipGates"
        :disabled="props.disabled"
        @update:skip-gates="onSkipGatesUpdate"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { ScenarioCategory } from "@/shared/model/scenario-types";
import { useI18n } from "@/shared/lib/i18n";
import { scenarioTitle, shortScenarioDescription } from "./scenarioDisplay";
import { useScenarioEstimate } from "./useScenarioEstimate";
import { useScenarioPickerTabs } from "./useScenarioPickerTabs";
import { useScenarioPickerCards } from "./useScenarioPickerCards";
import ScenarioCard from "./ScenarioCard.vue";
import ScenarioEstimatePanel from "./ScenarioEstimatePanel.vue";
import { useScenarioCatalog } from "@/entities/scenario";
import type { ScenarioSummary } from "@/shared/model/scenario-types";
import type { CustomScenarioSnap } from "@/shared/model/project-types";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    disabled?: boolean;
    favorites?: string[];
    customScenarios?: CustomScenarioSnap[];
    skipGates?: string[];
  }>(),
  {
    disabled: false,
    favorites: () => [],
    customScenarios: () => [],
    skipGates: () => [],
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  "update:skipGates": [value: string[]];
  select: [scenario: ScenarioSummary | null];
  "toggle-favorite": [scenarioId: string];
}>();

const { t } = useI18n();
const catalog = useScenarioCatalog();
const estimate = useScenarioEstimate();

watch(
  () => props.modelValue,
  (id) => {
    void estimate.load(id);
  },
  { immediate: true },
);

function onSkipGatesUpdate(next: string[]): void {
  emit("update:skipGates", next);
}

const activeTab = ref<ScenarioCategory>("development");

const { customSummaries, favoriteScenarios, visibleScenarios, isFavorite } =
  useScenarioPickerCards({
    customScenarios: computed(() => props.customScenarios),
    favorites: computed(() => props.favorites),
    catalogScenarios: catalog.scenarios,
    byCategory: catalog.byCategory,
    activeTab,
  });

const { categoryTabs } = useScenarioPickerTabs({
  t,
  byCategory: catalog.byCategory,
  customSummaries,
  modelValue: computed(() => props.modelValue),
  scenarios: catalog.scenarios,
  activeTab,
});

function onPick(item: ScenarioSummary): void {
  emit("update:modelValue", item.id);
  emit("select", item);
}

function onPickNone(): void {
  emit("update:modelValue", null);
  emit("select", null);
}

function onClear(): void {
  emit("update:modelValue", null);
  emit("select", null);
}
</script>

<style scoped>
.scenario-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 65%, transparent);
  margin-bottom: 10px;
}
.scenario-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.scenario-picker__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text2, #a8b0c4);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.scenario-picker__clear {
  font-size: 11px;
  padding: 3px 10px;
  background: transparent;
  color: var(--text2, #a8b0c4);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  cursor: pointer;
}
.scenario-picker__clear:hover {
  color: var(--text, #f5f0e7);
}
.scenario-picker__status,
.scenario-picker__error {
  font-size: 12px;
  padding: 8px 4px;
  color: var(--text2, #a8b0c4);
}
.scenario-picker__error {
  color: var(--error, #d7563f);
}
.scenario-picker__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.scenario-picker__tab {
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
}
.scenario-picker__tab:hover {
  color: var(--text, #f5f0e7);
}
.scenario-picker__tab.is-active {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-color: var(--accent, #3b5bdb);
}
.scenario-picker__tab-count {
  font-size: 10px;
  opacity: 0.8;
}
.scenario-picker__list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.scenario-picker__card {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  color: var(--text, #f5f0e7);
}
.scenario-picker__card:hover,
.scenario-picker__card.is-selected {
  border-color: var(--accent, #3b5bdb);
}
.scenario-picker__card.is-selected {
  box-shadow: 0 0 0 1px var(--accent, #3b5bdb) inset;
}
.scenario-picker__card--none {
  flex: 0 0 160px;
  justify-content: center;
  align-items: flex-start;
  font-style: italic;
}
.scenario-picker__card-title {
  font-size: 13px;
  font-weight: 600;
}
.scenario-picker__pill {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-radius: 999px;
}
.scenario-picker__section {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 6px;
}
.scenario-picker__section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
</style>
