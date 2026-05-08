import type { ScenarioSummary } from "@/shared/model/scenario-types";

type Translate = (
  key: string,
  params?: Record<string, string | number | null | undefined>,
) => string;

function translatedScenarioField(
  scenario: ScenarioSummary,
  field: "title" | "description",
  t: Translate,
): string {
  const key = `scenarios.catalog.${scenario.id}.${field}`;
  const value = t(key);
  return value === key ? scenario[field] : value;
}

export function scenarioTitle(scenario: ScenarioSummary, t: Translate): string {
  return translatedScenarioField(scenario, "title", t);
}

export function scenarioDescription(scenario: ScenarioSummary, t: Translate): string {
  return translatedScenarioField(scenario, "description", t);
}

export function shortScenarioDescription(
  scenario: ScenarioSummary,
  t: Translate,
  limit = 120,
): string {
  const text = scenarioDescription(scenario, t).trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}
