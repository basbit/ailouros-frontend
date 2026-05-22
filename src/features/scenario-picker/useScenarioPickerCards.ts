import { computed, type ComputedRef, type Ref } from "vue";
import type { ScenarioCategory, ScenarioSummary } from "@/shared/model/scenario-types";
import type { CustomScenarioSnap } from "@/shared/model/project-types";
import { CUSTOM_CATEGORY } from "./useScenarioPickerTabs";

interface ScenarioPickerCardsOptions {
  customScenarios: ComputedRef<CustomScenarioSnap[]>;
  favorites: ComputedRef<string[]>;
  catalogScenarios: Ref<ScenarioSummary[]> | ComputedRef<ScenarioSummary[]>;
  byCategory:
    | Ref<Record<string, ScenarioSummary[]>>
    | ComputedRef<Record<string, ScenarioSummary[]>>;
  activeTab: Ref<ScenarioCategory>;
}

export function useScenarioPickerCards({
  customScenarios,
  favorites,
  catalogScenarios,
  byCategory,
  activeTab,
}: ScenarioPickerCardsOptions) {
  const customSummaries = computed<ScenarioSummary[]>(() =>
    customScenarios.value.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      category: CUSTOM_CATEGORY,
      description: "",
      pipeline_steps: scenario.pipeline_steps,
      default_gates: [],
      expected_artifacts: [],
      required_tools: [],
      recommended_models: {},
      workspace_write_default: scenario.workspace_write_default,
      tags: [],
      quality_checks: [],
      inputs: [],
    })),
  );

  const favoriteSet = computed(() => new Set(favorites.value));

  const allScenarios = computed<ScenarioSummary[]>(() => [
    ...catalogScenarios.value,
    ...customSummaries.value,
  ]);

  const favoriteScenarios = computed<ScenarioSummary[]>(() =>
    allScenarios.value.filter((scenario) => favoriteSet.value.has(scenario.id)),
  );

  const visibleScenarios = computed<ScenarioSummary[]>(() => {
    if (activeTab.value === CUSTOM_CATEGORY) return customSummaries.value;
    const groups = byCategory.value;
    return groups[activeTab.value] ?? [];
  });

  function isFavorite(id: string): boolean {
    return favoriteSet.value.has(id);
  }

  return {
    customSummaries,
    favoriteSet,
    allScenarios,
    favoriteScenarios,
    visibleScenarios,
    isFavorite,
  };
}
