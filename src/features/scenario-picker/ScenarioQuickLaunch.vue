<template>
  <section v-if="quickPicks.length" class="scenario-quick">
    <span class="scenario-quick__label">{{ t("scenarios.quickLaunch") }}</span>
    <button
      v-for="entry in quickPicks"
      :key="entry.id"
      type="button"
      class="scenario-quick__btn"
      :class="{ 'is-active': entry.id === props.modelValue }"
      :disabled="props.disabled"
      :title="scenarioDescription(entry, t)"
      @click="onPick(entry.id)"
    >
      <span class="scenario-quick__title">{{ scenarioTitle(entry, t) }}</span>
      <span
        v-if="favoriteSet.has(entry.id)"
        class="scenario-quick__star"
        aria-hidden="true"
        >★</span
      >
    </button>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { scenarioDescription, scenarioTitle } from "./scenarioDisplay";
import { useScenarioCatalog } from "@/entities/scenario/model/useScenarioCatalog";
import type { ScenarioSummary } from "@/shared/model/scenario-types";

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    favorites?: string[];
    disabled?: boolean;
    maxItems?: number;
  }>(),
  { favorites: () => [], disabled: false, maxItems: 5 },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { t } = useI18n();
const catalog = useScenarioCatalog();

const favoriteSet = computed(() => new Set(props.favorites));

const SHORTCUT_PRIORITY: string[] = [
  "build_feature",
  "fix_bug",
  "code_review",
  "research_brief",
  "website_visual_qa",
  "data_analysis",
];

const quickPicks = computed<ScenarioSummary[]>(() => {
  const all = catalog.scenarios.value;
  if (!all.length) return [];
  const byId = new Map(all.map((scenario) => [scenario.id, scenario]));
  const picked: ScenarioSummary[] = [];
  const seen = new Set<string>();

  for (const id of props.favorites) {
    const found = byId.get(id);
    if (found && !seen.has(found.id)) {
      picked.push(found);
      seen.add(found.id);
    }
    if (picked.length >= props.maxItems) return picked.slice(0, props.maxItems);
  }
  for (const id of SHORTCUT_PRIORITY) {
    const found = byId.get(id);
    if (found && !seen.has(found.id)) {
      picked.push(found);
      seen.add(found.id);
    }
    if (picked.length >= props.maxItems) break;
  }
  return picked.slice(0, props.maxItems);
});

function onPick(id: string): void {
  emit("update:modelValue", id);
}
</script>

<style scoped>
.scenario-quick {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 6px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 50%, transparent);
}
.scenario-quick__label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  margin-right: 4px;
}
.scenario-quick__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface, #1a1d29);
  color: var(--text, #f5f0e7);
  cursor: pointer;
}
.scenario-quick__btn:hover {
  border-color: var(--accent, #3b5bdb);
}
.scenario-quick__btn.is-active {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-color: var(--accent, #3b5bdb);
}
.scenario-quick__btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
.scenario-quick__star {
  color: #f5b740;
  font-size: 12px;
}
</style>
