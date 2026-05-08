import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

const sampleScenario = {
  id: "build_feature",
  title: "Build Feature",
  category: "development" as const,
  description: "Implement a feature.",
  pipeline_steps: ["pm", "dev", "qa"],
  default_gates: [],
  expected_artifacts: [],
  required_tools: [],
  workspace_write_default: false,
  recommended_models: {},
  tags: [],
  quality_checks: [],
  inputs: [],
};

describe("useScenarioGraphIntegration", () => {
  beforeEach(async () => {
    vi.resetModules();
    api.getScenario.mockReset();
    api.validateScenarioPayload.mockReset();
  });

  it("converts a scenario into nodes and sequential edges", async () => {
    api.getScenario.mockResolvedValue(sampleScenario);
    const integrationModule = await import("../useScenarioGraphIntegration");
    const editorModule = await import("../useEditorStore");
    integrationModule._resetScenarioGraphIntegrationForTests();
    const integration = integrationModule.useScenarioGraphIntegration();
    const editor = editorModule.useEditorStore();

    await integration.loadScenarioIntoEditor("build_feature");

    expect(editor.pipeline.value.nodes.map((node) => node.id)).toEqual([
      "pm",
      "dev",
      "qa",
    ]);
    expect(editor.pipeline.value.edges.map((edge) => edge.id)).toEqual([
      "edge-pm-dev",
      "edge-dev-qa",
    ]);
    expect(integration.loadedScenarioId.value).toBe("build_feature");
    expect(integration.loadedScenarioMode.value).toBe("official");
  });

  it("clears scenario id and switches mode after duplicate", async () => {
    api.getScenario.mockResolvedValue(sampleScenario);
    const integrationModule = await import("../useScenarioGraphIntegration");
    integrationModule._resetScenarioGraphIntegrationForTests();
    const integration = integrationModule.useScenarioGraphIntegration();

    await integration.loadScenarioIntoEditor("build_feature");
    integration.duplicateLoadedAsCustom();

    expect(integration.loadedScenarioId.value).toBeNull();
    expect(integration.loadedScenarioMode.value).toBe("custom");
  });

  it("exports a JSON string containing all loaded steps", async () => {
    api.getScenario.mockResolvedValue(sampleScenario);
    const integrationModule = await import("../useScenarioGraphIntegration");
    integrationModule._resetScenarioGraphIntegrationForTests();
    const integration = integrationModule.useScenarioGraphIntegration();

    await integration.loadScenarioIntoEditor("build_feature");
    const json = integration.exportToScenarioJson();
    const parsed = JSON.parse(json);

    expect(parsed.id).toBe("build_feature");
    expect(parsed.pipeline_steps).toEqual(["pm", "dev", "qa"]);
    expect(parsed.category).toBe("development");
  });

  it("imports a payload after server validation succeeds", async () => {
    api.validateScenarioPayload.mockResolvedValue({
      valid: true,
      id: "imported_demo",
      summary: {
        ...sampleScenario,
        id: "imported_demo",
        title: "Imported Demo",
        pipeline_steps: ["pm", "dev"],
      },
    });
    const integrationModule = await import("../useScenarioGraphIntegration");
    const editorModule = await import("../useEditorStore");
    integrationModule._resetScenarioGraphIntegrationForTests();
    const integration = integrationModule.useScenarioGraphIntegration();
    const editor = editorModule.useEditorStore();

    const raw = JSON.stringify({
      id: "imported_demo",
      title: "Imported Demo",
      category: "development",
      description: "x",
      pipeline_steps: ["pm", "dev"],
    });
    await integration.importFromScenarioJson(raw);

    expect(api.validateScenarioPayload).toHaveBeenCalledTimes(1);
    expect(integration.loadedScenarioMode.value).toBe("imported");
    expect(integration.loadedScenarioId.value).toBe("imported_demo");
    expect(editor.pipeline.value.nodes.map((node) => node.id)).toEqual(["pm", "dev"]);
  });

  it("surfaces server error on import failure", async () => {
    api.validateScenarioPayload.mockRejectedValue(
      new Error("Unknown step ids in pipeline_steps: ['nope']"),
    );
    const integrationModule = await import("../useScenarioGraphIntegration");
    integrationModule._resetScenarioGraphIntegrationForTests();
    const integration = integrationModule.useScenarioGraphIntegration();

    const raw = JSON.stringify({
      id: "bad",
      title: "Bad",
      category: "development",
      description: "x",
      pipeline_steps: ["nope"],
    });
    await expect(integration.importFromScenarioJson(raw)).rejects.toThrow();
    expect(integration.importError.value).toContain("Unknown step ids");
  });
});
