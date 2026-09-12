import { useUxStore } from "@/shared/store/ux";
import { useI18n } from "@/shared/lib/i18n";
import {
  agentConfigErrorMessage,
  type RunSwarmChatSettings,
} from "@/entities/agent-config";
import type { ResolvedScenario } from "@/features/swarm-run/run-swarm-chat";
import { useScenarioCatalog } from "@/entities/scenario";
import type { ScenarioSummary } from "@/entities/scenario";
import type { CustomScenarioSnap } from "@/entities/project";
import type { SwarmRunState } from "./useSwarmRunState";

export function customScenarioToSummary(snap: CustomScenarioSnap): ScenarioSummary {
  return {
    id: snap.id,
    title: snap.title,
    category: "custom",
    description: "",
    pipeline_steps: snap.pipeline_steps,
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    recommended_models: {},
    workspace_write_default: snap.workspace_write_default,
    tags: [],
    quality_checks: [],
    inputs: [],
  };
}

export function useSwarmRunPreflight(
  state: SwarmRunState,
  settings: RunSwarmChatSettings,
) {
  const { ui, lastNotifiedError, runBootstrapPending } = state;
  const ux = useUxStore();
  const { t } = useI18n();
  const scenarioCatalog = useScenarioCatalog();

  async function resolveScenario(scenarioId: string): Promise<ResolvedScenario | null> {
    if (!scenarioCatalog.scenarios.value.length) {
      await scenarioCatalog.reload();
    }
    const fromCatalog = scenarioCatalog.scenarios.value.find(
      (entry) => entry.id === scenarioId,
    );
    if (fromCatalog) return { scenario: fromCatalog, isCustom: false };
    const custom = (settings.form.custom_scenarios ?? []).find(
      (entry) => entry.id === scenarioId,
    );
    return custom
      ? { scenario: customScenarioToSummary(custom), isCustom: true }
      : null;
  }

  function surfacePreflightFailure(): void {
    runBootstrapPending.value = false;
    const msg = agentConfigErrorMessage.value;
    if (!msg) {
      ui.taskStatus = null;
      return;
    }
    ui.taskError = msg;
    ui.taskStatus = "failed";
    if (lastNotifiedError.value !== msg) {
      ux.notify(`${t("toast.runError")}: ${msg}`, "error", 4200);
      lastNotifiedError.value = msg;
    }
  }

  return { resolveScenario, surfacePreflightFailure };
}
