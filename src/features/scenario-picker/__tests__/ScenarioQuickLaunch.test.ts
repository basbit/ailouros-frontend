import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

import ScenarioQuickLaunch from "@/features/scenario-picker/ScenarioQuickLaunch.vue";
import * as catalogModule from "@/entities/scenario/model/useScenarioCatalog";
import type { ScenarioSummary } from "@/shared/model/scenario-types";

function buildScenario(id: string, title: string): ScenarioSummary {
  return {
    id,
    title,
    category: "development",
    description: "desc",
    pipeline_steps: [],
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    workspace_write_default: false,
    recommended_models: {},
    tags: [],
    quality_checks: [],
    inputs: [],
  };
}

function mockCatalog(scenarios: ScenarioSummary[]) {
  return vi.spyOn(catalogModule, "useScenarioCatalog").mockReturnValue({
    scenarios: ref(scenarios),
    loading: ref(false),
    error: ref(null),
    byCategory: ref({} as never),
    reload: async () => {},
  } as never);
}

describe("ScenarioQuickLaunch", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides itself when catalog is empty", () => {
    mockCatalog([]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: null },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.find(".scenario-quick").exists()).toBe(false);
  });

  it("renders shortcut buttons in priority order from catalog", () => {
    mockCatalog([
      buildScenario("seo_aeo_geo_audit", "SEO Audit"),
      buildScenario("build_feature", "Build Feature"),
      buildScenario("research_brief", "Research Brief"),
      buildScenario("code_review", "Code Review"),
    ]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: null, maxItems: 5 },
      global: { plugins: [createPinia()] },
    });
    const labels = wrapper
      .findAll(".scenario-quick__btn .scenario-quick__title")
      .map((node) => node.text());
    expect(labels[0]).toBe("Build Feature");
    expect(labels).toContain("Code Review");
    expect(labels).toContain("Research Brief");
    expect(labels.length).toBeLessThanOrEqual(5);
  });

  it("places favorites before priority shortcuts", () => {
    mockCatalog([
      buildScenario("build_feature", "Build Feature"),
      buildScenario("seo_aeo_geo_audit", "SEO Audit"),
      buildScenario("code_review", "Code Review"),
    ]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: {
        modelValue: null,
        favorites: ["seo_aeo_geo_audit"],
        maxItems: 5,
      },
      global: { plugins: [createPinia()] },
    });
    const labels = wrapper
      .findAll(".scenario-quick__btn .scenario-quick__title")
      .map((node) => node.text());
    expect(labels[0]).toBe("SEO Audit");
  });

  it("emits update:modelValue when a button is clicked", async () => {
    mockCatalog([buildScenario("build_feature", "Build Feature")]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: null },
      global: { plugins: [createPinia()] },
    });
    await wrapper.find(".scenario-quick__btn").trigger("click");
    const events = wrapper.emitted("update:modelValue");
    expect(events).toBeDefined();
    expect(events![0]).toEqual(["build_feature"]);
  });

  it("marks the active scenario button as is-active", () => {
    mockCatalog([
      buildScenario("build_feature", "Build Feature"),
      buildScenario("code_review", "Code Review"),
    ]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: "code_review" },
      global: { plugins: [createPinia()] },
    });
    const buttons = wrapper.findAll(".scenario-quick__btn");
    const active = buttons.find((node) => node.classes().includes("is-active"));
    expect(active).toBeDefined();
    expect(active!.text()).toContain("Code Review");
  });

  it("disables all buttons when disabled prop is true", () => {
    mockCatalog([buildScenario("build_feature", "Build Feature")]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: null, disabled: true },
      global: { plugins: [createPinia()] },
    });
    const button = wrapper.find(".scenario-quick__btn");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("respects maxItems cap", () => {
    mockCatalog([
      buildScenario("build_feature", "Build Feature"),
      buildScenario("fix_bug", "Fix Bug"),
      buildScenario("code_review", "Code Review"),
      buildScenario("research_brief", "Research Brief"),
      buildScenario("website_visual_qa", "Visual QA"),
      buildScenario("data_analysis", "Data"),
    ]);
    const wrapper = mount(ScenarioQuickLaunch, {
      props: { modelValue: null, maxItems: 2 },
      global: { plugins: [createPinia()] },
    });
    expect(wrapper.findAll(".scenario-quick__btn")).toHaveLength(2);
  });
});
