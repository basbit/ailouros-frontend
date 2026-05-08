import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

import * as catalogModule from "../useScenarioCatalog";
import { useScenarioRunReadiness } from "../useScenarioRunReadiness";
import type { ScenarioInputSpec, ScenarioSummary } from "@/shared/model/scenario-types";

function buildScenario(id: string, inputs: ScenarioInputSpec[]): ScenarioSummary {
  return {
    id,
    title: id,
    category: "development",
    description: "",
    pipeline_steps: [],
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    workspace_write_default: false,
    recommended_models: {},
    tags: [],
    quality_checks: [],
    inputs,
  };
}

function emptyForm() {
  return {
    prompt: "",
    workspace_root: "",
    project_context_file: "",
    workspace_write: false,
  };
}

describe("useScenarioRunReadiness", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ready=true and no missing keys when no scenario selected", () => {
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const readiness = useScenarioRunReadiness(ref(null), ref(emptyForm()));
    expect(readiness.ready.value).toBe(true);
    expect(readiness.missingKeys.value).toEqual([]);
    expect(readiness.scenario.value).toBeNull();
  });

  it("returns ready=true when scenario has no required inputs", () => {
    const scenario = buildScenario("research_brief", [
      { key: "prompt", label: "P", hint: "", required: false },
    ]);
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([scenario]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const readiness = useScenarioRunReadiness(ref("research_brief"), ref(emptyForm()));
    expect(readiness.ready.value).toBe(true);
  });

  it("collects missing required keys in order", () => {
    const scenario = buildScenario("build_feature", [
      { key: "prompt", label: "P", hint: "", required: true },
      { key: "workspace_root", label: "W", hint: "", required: true },
      { key: "project_context_file", label: "C", hint: "", required: true },
    ]);
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([scenario]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const readiness = useScenarioRunReadiness(ref("build_feature"), ref(emptyForm()));
    expect(readiness.missingKeys.value).toEqual([
      "prompt",
      "workspace_root",
      "project_context_file",
    ]);
    expect(readiness.ready.value).toBe(false);
  });

  it("treats whitespace-only values as missing", () => {
    const scenario = buildScenario("research_brief", [
      { key: "prompt", label: "P", hint: "", required: true },
    ]);
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([scenario]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const form = ref({ ...emptyForm(), prompt: "   \n  " });
    const readiness = useScenarioRunReadiness(ref("research_brief"), form);
    expect(readiness.ready.value).toBe(false);
    expect(readiness.missingKeys.value).toEqual(["prompt"]);
  });

  it("becomes ready when required field becomes non-empty", () => {
    const scenario = buildScenario("research_brief", [
      { key: "prompt", label: "P", hint: "", required: true },
    ]);
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([scenario]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const form = ref(emptyForm());
    const readiness = useScenarioRunReadiness(ref("research_brief"), form);
    expect(readiness.ready.value).toBe(false);
    form.value = { ...form.value, prompt: "do x" };
    expect(readiness.ready.value).toBe(true);
    expect(readiness.missingKeys.value).toEqual([]);
  });

  it("declaredKeys mirrors scenario.inputs", () => {
    const scenario = buildScenario("build_feature", [
      { key: "prompt", label: "P", hint: "", required: true },
      { key: "workspace_root", label: "W", hint: "", required: false },
    ]);
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([scenario]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const readiness = useScenarioRunReadiness(ref("build_feature"), ref(emptyForm()));
    expect(readiness.declaredKeys.value.has("prompt")).toBe(true);
    expect(readiness.declaredKeys.value.has("workspace_root")).toBe(true);
    expect(readiness.declaredKeys.value.has("workspace_write")).toBe(false);
    expect(readiness.requiredKeys.value.has("workspace_root")).toBe(false);
  });

  it("returns null scenario for unknown id", () => {
    vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
      scenarios: ref([buildScenario("a", [])]),
      loading: ref(false),
      error: ref(null),
      byCategory: ref({} as never),
      reload: async () => {},
    } as never);
    const readiness = useScenarioRunReadiness(ref("does_not_exist"), ref(emptyForm()));
    expect(readiness.scenario.value).toBeNull();
    expect(readiness.ready.value).toBe(true);
  });
});
