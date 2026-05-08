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
        <div class="scenario-picker__section-label">
          {{ t("scenarios.favorites") }}
        </div>
        <div class="scenario-picker__list">
          <button
            v-for="item in favoriteScenarios"
            :key="`fav-${item.id}`"
            type="button"
            class="scenario-picker__card"
            :class="{ 'is-selected': item.id === props.modelValue }"
            :disabled="props.disabled"
            @click="onPick(item)"
          >
            <div class="scenario-picker__card-row">
              <span class="scenario-picker__card-title">
                {{ scenarioTitle(item, t) }}
              </span>
              <button
                type="button"
                class="scenario-picker__star is-active"
                :title="t('scenarios.unfavorite')"
                :disabled="props.disabled"
                @click="onToggleFavorite(item.id, $event)"
              >
                ★
              </button>
            </div>
            <p class="scenario-picker__card-desc">
              {{ shortScenarioDescription(item, t) }}
            </p>
          </button>
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

        <button
          v-for="item in visibleScenarios"
          :key="item.id"
          type="button"
          class="scenario-picker__card"
          :class="{ 'is-selected': item.id === props.modelValue }"
          :disabled="props.disabled"
          @click="onPick(item)"
        >
          <div class="scenario-picker__card-row">
            <span class="scenario-picker__card-title">
              {{ scenarioTitle(item, t) }}
            </span>
            <button
              type="button"
              class="scenario-picker__star"
              :class="{ 'is-active': isFavorite(item.id) }"
              :title="
                isFavorite(item.id)
                  ? t('scenarios.unfavorite')
                  : t('scenarios.favorite')
              "
              :disabled="props.disabled"
              @click="onToggleFavorite(item.id, $event)"
            >
              {{ isFavorite(item.id) ? "★" : "☆" }}
            </button>
            <span v-if="item.id === props.modelValue" class="scenario-picker__pill">
              {{ t("scenarios.selected") }}
            </span>
          </div>
          <p class="scenario-picker__card-desc">
            {{ shortScenarioDescription(item, t) }}
          </p>
          <div class="scenario-picker__card-meta">
            <span
              class="scenario-picker__badge"
              :class="
                item.workspace_write_default
                  ? 'scenario-picker__badge--write'
                  : 'scenario-picker__badge--read'
              "
            >
              {{
                item.workspace_write_default
                  ? t("scenarios.card.workspaceWriteOn")
                  : t("scenarios.card.workspaceWriteOff")
              }}
            </span>
            <span class="scenario-picker__badge">
              {{ t("scenarios.card.steps", { n: item.pipeline_steps.length }) }}
            </span>
          </div>
          <div v-if="item.tags.length" class="scenario-picker__tags">
            <span v-for="tag in item.tags" :key="tag" class="scenario-picker__tag">
              {{ tag }}
            </span>
          </div>
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { scenarioTitle, shortScenarioDescription } from "./scenarioDisplay";
import { useScenarioCatalog } from "./useScenarioCatalog";
import type { ScenarioCategory, ScenarioSummary } from "@/shared/model/scenario-types";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    disabled?: boolean;
    favorites?: string[];
  }>(),
  { disabled: false, favorites: () => [] },
);

const emit = defineEmits<{
  "update:modelValue": [value: string | null];
  select: [scenario: ScenarioSummary | null];
  "toggle-favorite": [scenarioId: string];
}>();

const { t } = useI18n();
const catalog = useScenarioCatalog();

const CATEGORY_ORDER: ScenarioCategory[] = [
  "development",
  "research",
  "code_quality",
  "content",
  "data",
  "product",
  "support",
  "visual_qa",
  "seo",
];

const categoryTabs = computed(() => {
  const groups = catalog.byCategory.value;
  return CATEGORY_ORDER.filter((category) => (groups[category] ?? []).length > 0).map(
    (category) => ({
      id: category,
      label: t(`scenarios.tab.${category}`),
      count: groups[category].length,
    }),
  );
});

const activeTab = ref<ScenarioCategory>("development");

watch(
  categoryTabs,
  (tabs) => {
    if (!tabs.length) return;
    if (!tabs.some((tab) => tab.id === activeTab.value)) {
      activeTab.value = tabs[0].id;
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (id) => {
    if (!id) return;
    const found = catalog.scenarios.value.find((scenario) => scenario.id === id);
    if (found) activeTab.value = found.category;
  },
);

const favoriteSet = computed(() => new Set(props.favorites));

const favoriteScenarios = computed(() =>
  catalog.scenarios.value.filter((scenario) => favoriteSet.value.has(scenario.id)),
);

const visibleScenarios = computed(() => {
  const groups = catalog.byCategory.value;
  return groups[activeTab.value] ?? [];
});

function isFavorite(id: string): boolean {
  return favoriteSet.value.has(id);
}

function onToggleFavorite(id: string, event: Event): void {
  event.stopPropagation();
  emit("toggle-favorite", id);
}

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
.scenario-picker__card:hover {
  border-color: var(--accent, #3b5bdb);
}
.scenario-picker__card.is-selected {
  border-color: var(--accent, #3b5bdb);
  box-shadow: 0 0 0 1px var(--accent, #3b5bdb) inset;
}
.scenario-picker__card--none {
  flex: 0 0 160px;
  justify-content: center;
  align-items: flex-start;
  font-style: italic;
}
.scenario-picker__card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.scenario-picker__card-title {
  font-size: 13px;
  font-weight: 600;
}
.scenario-picker__card-desc {
  margin: 0;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  line-height: 1.4;
}
.scenario-picker__card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.scenario-picker__badge {
  font-size: 10px;
  padding: 2px 6px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
}
.scenario-picker__badge--write {
  background: color-mix(in srgb, #d7563f 25%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-picker__badge--read {
  background: color-mix(in srgb, #3b5bdb 25%, transparent);
  color: var(--text, #f5f0e7);
}
.scenario-picker__pill {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-radius: 999px;
}
.scenario-picker__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.scenario-picker__tag {
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text3, #6b7280);
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
.scenario-picker__star {
  background: transparent;
  border: none;
  color: var(--text3, #6b7280);
  font-size: 14px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.scenario-picker__star:hover,
.scenario-picker__star.is-active {
  color: #f5b740;
}
</style>
