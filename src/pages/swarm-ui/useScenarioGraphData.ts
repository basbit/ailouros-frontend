import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { scenarioTitle, useScenarioPreview } from "@/features/scenario-picker";
import type { useSettings } from "@/app/providers/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

interface ActiveScenarioLike {
  workspace_write_default?: boolean;
  default_gates?: string[];
  required_tools?: string[];
}

export interface ScenarioGraphData {
  scenarioPreview: ReturnType<typeof useScenarioPreview>;
  scenarioPreviewTitle: ComputedRef<string | undefined>;
  scenarioGraphWorkspaceWrite: ComputedRef<boolean>;
  scenarioGraphGates: ComputedRef<string[]>;
  scenarioGraphTools: ComputedRef<string[]>;
  scenarioGraphWarningTools: ComputedRef<string[]>;
}

export function useScenarioGraphData(
  settings: SettingsApi,
  isCustomScenario: Ref<boolean> | ComputedRef<boolean>,
  activeScenario:
    | Ref<ActiveScenarioLike | null>
    | ComputedRef<ActiveScenarioLike | null>,
  effectivePipelineSteps: Ref<string[]> | ComputedRef<string[]>,
): ScenarioGraphData {
  const { t } = useI18n();

  const scenarioPreviewId = computed(() =>
    isCustomScenario.value ? null : settings.form.scenario_id,
  );
  const scenarioPreview = useScenarioPreview(scenarioPreviewId);

  const scenarioPreviewTitle = computed(() => {
    const scenario = scenarioPreview.preview.value?.scenario;
    return scenario ? scenarioTitle(scenario, t) : undefined;
  });

  const scenarioGraphWorkspaceWrite = computed(() => {
    if (isCustomScenario.value) return !!settings.form.workspace_write;
    const fromPreview = scenarioPreview.preview.value?.workspace_write;
    if (typeof fromPreview === "boolean") return fromPreview;
    return !!activeScenario.value?.workspace_write_default;
  });

  const scenarioGraphGates = computed<string[]>(() => {
    if (isCustomScenario.value) {
      return effectivePipelineSteps.value.filter((id) => id.startsWith("human_"));
    }
    const fromPreview = scenarioPreview.preview.value?.default_gates;
    if (fromPreview && fromPreview.length) return fromPreview;
    return activeScenario.value?.default_gates ?? [];
  });

  const scenarioGraphTools = computed<string[]>(() => {
    if (isCustomScenario.value) return [];
    const fromPreview = scenarioPreview.preview.value?.required_tools;
    if (fromPreview && fromPreview.length) return fromPreview;
    return activeScenario.value?.required_tools ?? [];
  });

  const scenarioGraphWarningTools = computed<string[]>(() => {
    const preview = scenarioPreview.preview.value;
    if (!preview) return [];
    const warnings = preview.warnings ?? [];
    return preview.required_tools.filter((tool) =>
      warnings.some(
        (warning) => warning.includes(`'${tool}'`) || warning.includes(`"${tool}"`),
      ),
    );
  });

  return {
    scenarioPreview,
    scenarioPreviewTitle,
    scenarioGraphWorkspaceWrite,
    scenarioGraphGates,
    scenarioGraphTools,
    scenarioGraphWarningTools,
  };
}
