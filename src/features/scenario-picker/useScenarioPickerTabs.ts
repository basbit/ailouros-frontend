import { computed, watch, type ComputedRef, type Ref } from "vue";
import type { ScenarioCategory, ScenarioSummary } from "@/shared/model/scenario-types";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

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

export const CUSTOM_CATEGORY: ScenarioCategory = "custom";

interface ScenarioPickerTabsOptions {
  t: TranslatorLike;
  byCategory:
    | Ref<Record<string, ScenarioSummary[]>>
    | ComputedRef<Record<string, ScenarioSummary[]>>;
  customSummaries: ComputedRef<ScenarioSummary[]>;
  modelValue: ComputedRef<string | null>;
  scenarios: Ref<ScenarioSummary[]> | ComputedRef<ScenarioSummary[]>;
  activeTab: Ref<ScenarioCategory>;
}

export function useScenarioPickerTabs({
  t,
  byCategory,
  customSummaries,
  modelValue,
  scenarios,
  activeTab,
}: ScenarioPickerTabsOptions) {
  const categoryTabs = computed(() => {
    const groups = byCategory.value;
    const tabs = CATEGORY_ORDER.filter(
      (category) => (groups[category] ?? []).length > 0,
    ).map((category) => ({
      id: category,
      label: t(`scenarios.tab.${category}`),
      count: groups[category].length,
    }));
    if (customSummaries.value.length) {
      tabs.unshift({
        id: CUSTOM_CATEGORY,
        label: t("scenarios.tab.custom"),
        count: customSummaries.value.length,
      });
    }
    return tabs;
  });

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

  watch(modelValue, (id) => {
    if (!id) return;
    const found = scenarios.value.find((scenario) => scenario.id === id);
    if (found) activeTab.value = found.category;
  });

  return { activeTab, categoryTabs };
}
