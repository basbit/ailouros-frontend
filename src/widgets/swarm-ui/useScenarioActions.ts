/**
 * useScenarioActions — scenario chip selection, scenario input updates,
 * first-run scenario panel state, custom scenario create/save/select.
 *
 * Extracted verbatim from `SwarmUiPage`; no semantic changes.
 */

import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import { CUSTOM_SCENARIO_ID } from "@/shared/lib/swarm-ui-constants";
import type { useSettings } from "@/widgets/settings/useSettings";

type SettingsApi = ReturnType<typeof useSettings>;

interface ActiveScenarioLike {
  pipeline_steps: string[];
}

export interface ScenarioActions {
  firstRunScenarioVisible: Ref<boolean>;
  scenarioInputValues: ComputedRef<Record<string, string | boolean>>;
  onScenarioInputUpdate: (key: string, value: string | boolean) => void;
  onScenarioChipSelect: (scenarioId: string | null) => void;
  onFirstRunScenarioPick: (scenarioId: string) => void;
  onFirstRunScenarioSkip: () => void;
  onCopyScenarioToCustom: () => void;
  onSelectCustomScenario: (scenarioId: string) => void;
  onSaveCustomScenario: () => Promise<void>;
}

const FIRST_RUN_SCENARIO_DISMISS_KEY = "ailouros.first-run-scenario-panel.dismissed";

export function useScenarioActions(
  settings: SettingsApi,
  activeScenario:
    | Ref<ActiveScenarioLike | null>
    | ComputedRef<ActiveScenarioLike | null>,
): ScenarioActions {
  const ux = useUxStore();
  const { t } = useI18n();

  const firstRunScenarioVisible = ref(
    typeof localStorage === "undefined"
      ? true
      : localStorage.getItem(FIRST_RUN_SCENARIO_DISMISS_KEY) !== "1",
  );

  const scenarioInputValues = computed<Record<string, string | boolean>>(() => ({
    prompt: settings.form.prompt ?? "",
    workspace_root: settings.form.workspace_root ?? "",
    project_context_file: settings.form.project_context_file ?? "",
    workspace_write: !!settings.form.workspace_write,
  }));

  function onScenarioInputUpdate(key: string, value: string | boolean): void {
    if (key === "prompt" && typeof value === "string") {
      settings.form.prompt = value;
    } else if (key === "workspace_root" && typeof value === "string") {
      settings.form.workspace_root = value;
    } else if (key === "project_context_file" && typeof value === "string") {
      settings.form.project_context_file = value;
    } else if (key === "workspace_write" && typeof value === "boolean") {
      settings.form.workspace_write = value;
    }
    settings.saveSettingsSoon();
  }

  function onScenarioChipSelect(scenarioId: string | null): void {
    const next = !scenarioId || scenarioId === CUSTOM_SCENARIO_ID ? null : scenarioId;
    settings.form.scenario_id = next;
    if (next) {
      settings.form.custom_scenario_id = null;
    }
    settings.saveSettingsSoon();
  }

  function dismissFirstRunScenarioPanel(): void {
    firstRunScenarioVisible.value = false;
    try {
      localStorage.setItem(FIRST_RUN_SCENARIO_DISMISS_KEY, "1");
    } catch {
      return;
    }
  }

  function onFirstRunScenarioPick(scenarioId: string): void {
    onScenarioChipSelect(scenarioId);
    dismissFirstRunScenarioPanel();
  }

  function onFirstRunScenarioSkip(): void {
    dismissFirstRunScenarioPanel();
  }

  function onCopyScenarioToCustom(): void {
    const scenario = activeScenario.value;
    if (!scenario) return;
    settings.pipelineState.applyStepIds(scenario.pipeline_steps);
    settings.form.scenario_id = null;
    settings.form.custom_scenario_id = null;
    settings.saveSettingsSoon();
  }

  function makeCustomScenarioId(title: string): string {
    const base =
      title
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}0-9]+/gu, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 48) || "custom_scenario";
    const existing = new Set(settings.form.custom_scenarios.map((item) => item.id));
    let candidate = base;
    let index = 2;
    while (existing.has(candidate)) {
      candidate = `${base}_${index}`;
      index += 1;
    }
    return candidate;
  }

  function onSelectCustomScenario(scenarioId: string): void {
    const id = scenarioId.trim();
    settings.form.scenario_id = null;
    if (!id) {
      settings.form.custom_scenario_id = null;
      settings.saveSettingsSoon();
      return;
    }
    const scenario = settings.form.custom_scenarios.find((item) => item.id === id);
    if (!scenario) return;
    settings.pipelineState.applyStepIds(scenario.pipeline_steps);
    settings.form.workspace_write = scenario.workspace_write_default;
    settings.form.custom_scenario_id = scenario.id;
    settings.saveSettingsSoon();
  }

  async function onSaveCustomScenario(): Promise<void> {
    const steps = settings.pipelineState.collectStepIds();
    if (!steps.length) {
      ux.notify(t("graph.saveCustomScenarioEmpty"), "warning", 2200);
      return;
    }
    const activeId = settings.form.custom_scenario_id;
    const activeCustom = activeId
      ? settings.form.custom_scenarios.find((item) => item.id === activeId)
      : null;
    const title = (
      (await ux.promptDialog({
        title: t("graph.saveCustomScenarioTitle"),
        message: t("graph.saveCustomScenarioMessage"),
        value: activeCustom?.title ?? t("graph.customScenarioDefaultName"),
      })) ?? ""
    ).trim();
    if (!title) return;

    const id = activeCustom?.id ?? makeCustomScenarioId(title);
    const nextScenario = {
      id,
      title,
      pipeline_steps: steps,
      workspace_write_default: !!settings.form.workspace_write,
    };
    const index = settings.form.custom_scenarios.findIndex((item) => item.id === id);
    if (index >= 0) {
      settings.form.custom_scenarios.splice(index, 1, nextScenario);
    } else {
      settings.form.custom_scenarios.push(nextScenario);
    }
    settings.form.scenario_id = null;
    settings.form.custom_scenario_id = id;
    settings.saveSettingsSoon();
    ux.notify(t("graph.saveCustomScenarioSaved"), "success", 1800);
  }

  return {
    firstRunScenarioVisible,
    scenarioInputValues,
    onScenarioInputUpdate,
    onScenarioChipSelect,
    onFirstRunScenarioPick,
    onFirstRunScenarioSkip,
    onCopyScenarioToCustom,
    onSelectCustomScenario,
    onSaveCustomScenario,
  };
}
