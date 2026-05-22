import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useScenarioCatalog } from "@/entities/scenario";
import { useUxStore } from "@/shared/store/ux";

type TranslatorArgs = Record<string, string | number | null | undefined>;

interface TranslatorLike {
  (key: string, args?: TranslatorArgs): string;
}

export type ScenariosPaneFilter = "all" | "custom";

export interface ScenarioCard {
  id: string;
  title: string;
  description?: string;
  steps: number;
  custom: boolean;
}

function generateCloneId(sourceId: string): string {
  const stamp = Date.now().toString(36);
  return `${sourceId}-copy-${stamp}`;
}

export function useScenariosPaneCards(t: TranslatorLike) {
  const settings = useInjectedAppSettings();
  const catalog = useScenarioCatalog();
  const ux = useUxStore();
  const router = useRouter();

  const searchQuery = ref("");
  const filter = ref<ScenariosPaneFilter>("all");

  const filters = computed<Array<{ key: ScenariosPaneFilter; label: string }>>(() => [
    { key: "all", label: t("settings.scenarios.filterAll") },
    { key: "custom", label: t("settings.scenarios.filterCustom") },
  ]);

  const customScenarios = computed(() => settings.form.custom_scenarios ?? []);

  const allCards = computed<ScenarioCard[]>(() => {
    const catalogCards: ScenarioCard[] = catalog.scenarios.value.map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      steps: entry.pipeline_steps?.length ?? 0,
      custom: false,
    }));
    const customCards: ScenarioCard[] = customScenarios.value.map((entry) => ({
      id: entry.id,
      title: entry.title,
      steps: entry.pipeline_steps?.length ?? 0,
      custom: true,
    }));
    return [...customCards, ...catalogCards];
  });

  const filteredCards = computed<ScenarioCard[]>(() => {
    const term = searchQuery.value.trim().toLowerCase();
    return allCards.value.filter((card) => {
      if (filter.value === "custom" && !card.custom) return false;
      if (!term) return true;
      return (
        card.title.toLowerCase().includes(term) ||
        (card.description ?? "").toLowerCase().includes(term) ||
        card.id.toLowerCase().includes(term)
      );
    });
  });

  const selectedScenarioId = computed<string | null>(
    () => settings.form.scenario_id ?? null,
  );

  function onSelect(id: string): void {
    settings.form.scenario_id = id;
    settings.saveSettingsSoon();
  }

  function onNew(): void {
    void router.push("/scenarios/new");
  }

  function onEdit(id: string): void {
    void router.push(`/scenarios/edit/${encodeURIComponent(id)}`);
  }

  async function onCloneAs(sourceId: string, title: string): Promise<void> {
    const newTitle = await ux.promptDialog({
      title: t("settings.scenarios.cloneAsPromptTitle"),
      message: t("settings.scenarios.cloneAsPromptMessage", { title }),
      value: `${title} ${t("settings.scenarios.cloneAsDefaultSuffix")}`,
    });
    if (!newTitle || !newTitle.trim()) return;
    const source = catalog.scenarios.value.find((entry) => entry.id === sourceId);
    if (!source) return;
    const cloneId = generateCloneId(sourceId);
    const payload = {
      id: cloneId,
      title: newTitle.trim(),
      description: source.description ?? "",
      pipeline_steps: [...(source.pipeline_steps ?? [])],
      default_gates: [...(source.default_gates ?? [])],
      expected_artifacts: [...(source.expected_artifacts ?? [])],
      required_tools: [...(source.required_tools ?? [])],
      workspace_write_default: source.workspace_write_default ?? false,
      tags: [...(source.tags ?? [])],
      category: source.category ?? "custom",
      recommended_models: { ...(source.recommended_models ?? {}) },
    };
    settings.form.custom_scenarios = [
      ...customScenarios.value,
      payload as (typeof customScenarios.value)[number],
    ];
    settings.saveSettingsSoon();
    void router.push(`/scenarios/edit/${encodeURIComponent(cloneId)}`);
  }

  async function onEditAsClone(sourceId: string, title: string): Promise<void> {
    await onCloneAs(sourceId, title);
  }

  async function onDelete(id: string, title: string): Promise<void> {
    const confirmed = await ux.confirmDialog({
      title: t("settings.scenarios.deleteButton"),
      message: t("settings.scenarios.deleteConfirm", { title }),
    });
    if (!confirmed) return;
    settings.form.custom_scenarios = customScenarios.value.filter(
      (entry) => entry.id !== id,
    );
    if (settings.form.custom_scenario_id === id) {
      settings.form.custom_scenario_id = null;
    }
    settings.saveSettingsSoon();
  }

  return {
    searchQuery,
    filter,
    filters,
    filteredCards,
    selectedScenarioId,
    onSelect,
    onNew,
    onEdit,
    onCloneAs,
    onEditAsClone,
    onDelete,
  };
}
