import type { BaseSettingsDefaults } from "./projects-store";
import type { CustomScenarioSnap } from "./types";
import type { ScenarioProjectOverride } from "@/shared/model/scenario-types";

/**
 * The editable project settings the UI binds to.
 *
 * Declared here, in the layer that owns the project model, so that consumers
 * depend on a written-down shape instead of on whatever an `app`-layer
 * composable happens to return.
 */
export type ProjectSettingsFormState = BaseSettingsDefaults & {
  custom_scenarios: CustomScenarioSnap[];
  favorite_scenarios: string[];
  scenario_overrides: Record<string, ScenarioProjectOverride>;
};
