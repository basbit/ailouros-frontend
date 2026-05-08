import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";

import FirstRunScenarioPanel from "@/widgets/onboarding-wizard/FirstRunScenarioPanel.vue";
import * as scenarioPicker from "@/features/scenario-picker";
import type { ScenarioSummary } from "@/shared/model/scenario-types";

function buildScenario(
  id: string,
  title: string,
  description: string,
): ScenarioSummary {
  return {
    id,
    title,
    category: "development",
    description,
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
  return vi.spyOn(scenarioPicker, "useScenarioCatalog").mockReturnValue({
    scenarios: ref(scenarios),
    loading: ref(false),
    error: ref(null),
    byCategory: ref({} as never),
    reload: async () => {},
  } as never);
}

describe("FirstRunScenarioPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "ru");
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders first-run scenario cards in Russian", () => {
    mockCatalog([
      buildScenario("build_feature", "Build Feature", "Implement a feature."),
      buildScenario("code_review", "Code Review", "Review code."),
      buildScenario("research_brief", "Research Brief", "Research sources."),
      buildScenario("website_visual_qa", "Website Visual QA", "Inspect a site."),
      buildScenario("data_analysis", "Data Analysis", "Analyze data."),
    ]);

    const wrapper = mount(FirstRunScenarioPanel, {
      props: { visible: true },
      global: {
        plugins: [createPinia()],
        stubs: { CapabilityList: true },
      },
    });

    const titles = wrapper.findAll(".first-run__card-title").map((node) => node.text());
    expect(titles).toEqual([
      "Разработка функции",
      "Код-ревью",
      "Исследовательская справка",
      "Визуальный QA сайта",
      "Анализ данных",
    ]);
    expect(wrapper.text()).not.toContain("Build Feature");
  });
});
