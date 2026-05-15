import { computed } from "vue";
import type { ComputedRef, Ref } from "vue";
import { useScenarioCatalog } from "@/entities/scenario/model/useScenarioCatalog";
import type { ScenarioInputKey, ScenarioSummary } from "@/shared/model/scenario-types";

export interface RunFormSnapshot {
  prompt: string;
  workspace_root: string;
  project_context_file: string;
  workspace_write: boolean;
}

export interface ScenarioRunReadiness {
  scenario: ComputedRef<ScenarioSummary | null>;
  declaredKeys: ComputedRef<Set<ScenarioInputKey>>;
  requiredKeys: ComputedRef<Set<ScenarioInputKey>>;
  missingKeys: ComputedRef<ScenarioInputKey[]>;
  ready: ComputedRef<boolean>;
}

export function useScenarioRunReadiness(
  scenarioId: Ref<string | null>,
  form: Ref<RunFormSnapshot>,
): ScenarioRunReadiness {
  const catalog = useScenarioCatalog();

  const scenario = computed<ScenarioSummary | null>(() => {
    const id = scenarioId.value;
    if (!id) return null;
    return catalog.scenarios.value.find((entry) => entry.id === id) ?? null;
  });

  const declaredKeys = computed<Set<ScenarioInputKey>>(() => {
    const target = scenario.value;
    if (!target) return new Set();
    return new Set(target.inputs.map((spec) => spec.key));
  });

  const requiredKeys = computed<Set<ScenarioInputKey>>(() => {
    const target = scenario.value;
    if (!target) return new Set();
    return new Set(
      target.inputs.filter((spec) => spec.required).map((spec) => spec.key),
    );
  });

  const missingKeys = computed<ScenarioInputKey[]>(() => {
    const required = requiredKeys.value;
    if (required.size === 0) return [];
    const snapshot = form.value;
    const missing: ScenarioInputKey[] = [];
    if (required.has("prompt") && !snapshot.prompt.trim()) {
      missing.push("prompt");
    }
    if (required.has("workspace_root") && !snapshot.workspace_root.trim()) {
      missing.push("workspace_root");
    }
    if (required.has("project_context_file") && !snapshot.project_context_file.trim()) {
      missing.push("project_context_file");
    }
    if (required.has("workspace_write") && !snapshot.workspace_write) {
      missing.push("workspace_write");
    }
    return missing;
  });

  const ready = computed(() => missingKeys.value.length === 0);

  return { scenario, declaredKeys, requiredKeys, missingKeys, ready };
}
