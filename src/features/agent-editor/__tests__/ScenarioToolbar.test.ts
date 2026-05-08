import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const api = vi.hoisted(() => ({
  listScenarios: vi.fn(),
  getScenario: vi.fn(),
  previewScenario: vi.fn(),
  validateScenarioPayload: vi.fn(),
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
    description: "Implement a feature.",
    pipeline_steps: ["pm", "dev", "qa"],
    default_gates: [],
    expected_artifacts: [],
    required_tools: [],
    workspace_write_default: true,
    recommended_models: {},
    tags: [],
    quality_checks: [],
    inputs: [],
  },
];

describe("ScenarioToolbar", () => {
  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    vi.resetModules();
    api.listScenarios.mockResolvedValue({
      version: 1,
      scenarios: sampleScenarios,
    });
    api.getScenario.mockResolvedValue(sampleScenarios[0]);
    const { _resetScenarioCatalogForTests } =
      await import("@/features/scenario-picker/useScenarioCatalog");
    _resetScenarioCatalogForTests();
    const { _resetScenarioGraphIntegrationForTests } =
      await import("../useScenarioGraphIntegration");
    _resetScenarioGraphIntegrationForTests();
  });

  it("renders open, export, and import controls", async () => {
    const { default: ScenarioToolbar } = await import("../ScenarioToolbar.vue");
    const wrapper = mount(ScenarioToolbar);
    await flushPromises();

    expect(wrapper.text()).toContain("Open scenario");
    expect(wrapper.text()).toContain("Export JSON");
    expect(wrapper.text()).toContain("Import");
    expect(wrapper.text()).toContain("Duplicate as custom");
  });

  it("disables duplicate before any scenario is loaded", async () => {
    const { default: ScenarioToolbar } = await import("../ScenarioToolbar.vue");
    const wrapper = mount(ScenarioToolbar);
    await flushPromises();
    const buttons = wrapper.findAll("button");
    const duplicate = buttons.find((b) => b.text().includes("Duplicate as custom"));
    expect(duplicate).toBeTruthy();
    expect(duplicate!.attributes("disabled")).toBeDefined();
  });

  it("flips mode indicator from official to custom after duplicate", async () => {
    const { default: ScenarioToolbar } = await import("../ScenarioToolbar.vue");
    const wrapper = mount(ScenarioToolbar);
    await flushPromises();

    const select = wrapper.find("select");
    await select.setValue("build_feature");
    const openBtn = wrapper.findAll("button").find((b) => b.text() === "Select");
    expect(openBtn).toBeTruthy();
    await openBtn!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Editing scenario build_feature");

    const duplicate = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Duplicate as custom"));
    expect(duplicate!.attributes("disabled")).toBeUndefined();
    await duplicate!.trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("custom");
  });
});
