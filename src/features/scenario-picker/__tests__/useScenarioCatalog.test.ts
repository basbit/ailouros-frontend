import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  listScenarios: vi.fn(),
  getScenario: vi.fn(),
  previewScenario: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/scenarios", () => api);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useScenarioCatalog", () => {
  beforeEach(async () => {
    vi.resetModules();
    api.listScenarios.mockReset();
  });

  it("loads scenarios on first call and exposes them", async () => {
    api.listScenarios.mockResolvedValue({
      version: 1,
      scenarios: [
        {
          id: "build_feature",
          title: "Build Feature",
          category: "development",
          description: "",
          pipeline_steps: ["pm"],
          default_gates: [],
          expected_artifacts: [],
          required_tools: [],
          workspace_write_default: true,
          recommended_models: {},
          tags: [],
        },
        {
          id: "research_brief",
          title: "Research Brief",
          category: "research",
          description: "",
          pipeline_steps: ["pm", "writer"],
          default_gates: [],
          expected_artifacts: [],
          required_tools: [],
          workspace_write_default: false,
          recommended_models: {},
          tags: [],
        },
      ],
    });

    const { useScenarioCatalog, _resetScenarioCatalogForTests } =
      await import("@/entities/scenario/model/useScenarioCatalog");
    _resetScenarioCatalogForTests();
    const catalog = useScenarioCatalog();
    await vi.waitFor(() => {
      expect(catalog.loading.value).toBe(false);
    });
    expect(catalog.scenarios.value).toHaveLength(2);
    expect(catalog.error.value).toBeNull();
  });

  it("groups scenarios by category", async () => {
    api.listScenarios.mockResolvedValue({
      version: 1,
      scenarios: [
        {
          id: "build_feature",
          title: "Build Feature",
          category: "development",
          description: "",
          pipeline_steps: [],
          default_gates: [],
          expected_artifacts: [],
          required_tools: [],
          workspace_write_default: true,
          recommended_models: {},
          tags: [],
        },
        {
          id: "research_brief",
          title: "Research Brief",
          category: "research",
          description: "",
          pipeline_steps: [],
          default_gates: [],
          expected_artifacts: [],
          required_tools: [],
          workspace_write_default: false,
          recommended_models: {},
          tags: [],
        },
      ],
    });

    const { useScenarioCatalog, _resetScenarioCatalogForTests } =
      await import("@/entities/scenario/model/useScenarioCatalog");
    _resetScenarioCatalogForTests();
    const catalog = useScenarioCatalog();
    await vi.waitFor(() => {
      expect(catalog.loading.value).toBe(false);
    });
    expect(catalog.byCategory.value.development).toHaveLength(1);
    expect(catalog.byCategory.value.research).toHaveLength(1);
    expect(catalog.byCategory.value.content).toEqual([]);
  });

  it("exposes the error message and empty list on fetch failure", async () => {
    api.listScenarios.mockRejectedValue(new Error("network down"));

    const { useScenarioCatalog, _resetScenarioCatalogForTests } =
      await import("@/entities/scenario/model/useScenarioCatalog");
    _resetScenarioCatalogForTests();
    const catalog = useScenarioCatalog();
    await vi.waitFor(() => {
      expect(catalog.loading.value).toBe(false);
    });
    expect(catalog.error.value).toBe("network down");
    expect(catalog.scenarios.value).toEqual([]);
  });
});
