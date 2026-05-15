import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const api = vi.hoisted(() => ({
  listScenarios: vi.fn(),
  getScenario: vi.fn(),
  previewScenario: vi.fn(),
  getScenarioEstimate: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/scenarios", () => api);

afterEach(() => {
  vi.clearAllMocks();
});

const sampleScenarios = [
  {
    id: "build_feature",
    title: "Build Feature",
    category: "development" as const,
    description: "Implement a feature in an existing codebase.",
    pipeline_steps: ["pm", "dev", "qa"],
    default_gates: ["human_qa"],
    expected_artifacts: ["pipeline.json"],
    required_tools: ["workspace_write"],
    workspace_write_default: true,
    recommended_models: {},
    tags: ["development"],
  },
  {
    id: "research_brief",
    title: "Research Brief",
    category: "research" as const,
    description: "Find sources and synthesize a brief.",
    pipeline_steps: ["pm", "writer"],
    default_gates: [],
    expected_artifacts: ["brief.md"],
    required_tools: ["web_search"],
    workspace_write_default: false,
    recommended_models: {},
    tags: ["research"],
  },
];

describe("ScenarioPicker", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.resetModules();
    api.listScenarios.mockResolvedValue({ version: 1, scenarios: sampleScenarios });
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "build_feature",
      steps: [
        { step_id: "pm", estimated_duration_sec: 60, essential: true },
        { step_id: "dev", estimated_duration_sec: 120, essential: true },
        { step_id: "qa", estimated_duration_sec: 90, essential: false },
      ],
      total_seconds: 270,
      essential_seconds: 180,
    });
    const { _resetScenarioCatalogForTests } =
      await import("@/entities/scenario/model/useScenarioCatalog");
    _resetScenarioCatalogForTests();
  });

  it("renders cards from a stubbed catalog", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: null },
    });
    await flushPromises();
    expect(wrapper.text()).toContain("Build Feature");
    expect(wrapper.text()).toContain("Custom (no scenario)");
  });

  it("emits update:modelValue with id when a card is clicked", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: null },
    });
    await flushPromises();
    const cards = wrapper.findAll(".scenario-picker__card");
    const featureCard = cards.find((c) => c.text().includes("Build Feature"));
    expect(featureCard).toBeTruthy();
    await featureCard!.trigger("click");
    const events = wrapper.emitted("update:modelValue");
    expect(events).toBeTruthy();
    expect(events![0]).toEqual(["build_feature"]);
  });

  it("emits null when the Custom card is clicked", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: "build_feature" },
    });
    await flushPromises();
    const noneCard = wrapper.find(".scenario-picker__card--none");
    await noneCard.trigger("click");
    const events = wrapper.emitted("update:modelValue");
    expect(events).toBeTruthy();
    expect(events![0]).toEqual([null]);
  });

  it("marks the matching card as selected", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: "build_feature" },
    });
    await flushPromises();
    const selected = wrapper.find(".scenario-picker__card.is-selected");
    expect(selected.exists()).toBe(true);
    expect(selected.text()).toContain("Build Feature");
  });

  it("renders duration breakdown and skip toggles for non-essential steps", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: "build_feature", skipGates: [] },
    });
    await flushPromises();
    const block = wrapper.find('[data-testid="scenario-estimate"]');
    expect(block.exists()).toBe(true);
    expect(block.text()).toContain("Total");
    expect(block.text()).toContain("Essential only");
    const stepRows = wrapper.findAll(".scenario-estimate__step");
    expect(stepRows.length).toBe(3);
    expect(api.getScenarioEstimate).toHaveBeenCalledWith("build_feature");
    const optionalCheckbox = stepRows[2].find("input[type=checkbox]");
    expect((optionalCheckbox.element as HTMLInputElement).disabled).toBe(false);
    const essentialCheckbox = stepRows[0].find("input[type=checkbox]");
    expect((essentialCheckbox.element as HTMLInputElement).disabled).toBe(true);
    await optionalCheckbox.setValue(false);
    const events = wrapper.emitted("update:skipGates");
    expect(events).toBeTruthy();
    expect(events![0]).toEqual([["qa"]]);
  });

  it("master skip toggle adds all non-essential steps to skip set", async () => {
    const { default: ScenarioPicker } = await import("../ScenarioPicker.vue");
    const wrapper = mount(ScenarioPicker, {
      props: { modelValue: "build_feature", skipGates: [] },
    });
    await flushPromises();
    const skipAll = wrapper.find(".scenario-estimate__skip-all input");
    await skipAll.setValue(true);
    const events = wrapper.emitted("update:skipGates");
    expect(events).toBeTruthy();
    expect(events![0]).toEqual([["qa"]]);
  });
});
