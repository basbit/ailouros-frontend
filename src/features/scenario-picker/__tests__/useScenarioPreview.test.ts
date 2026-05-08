import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const api = vi.hoisted(() => ({
  listScenarios: vi.fn(),
  getScenario: vi.fn(),
  previewScenario: vi.fn(),
}));

vi.mock("@/shared/api/endpoints/scenarios", () => api);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useScenarioPreview", () => {
  beforeEach(() => {
    vi.resetModules();
    api.previewScenario.mockReset();
  });

  it("keeps preview null when scenario id is null", async () => {
    const { useScenarioPreview } = await import("../useScenarioPreview");
    const id = ref<string | null>(null);
    const { preview, loading, error } = useScenarioPreview(id, undefined, 0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(preview.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(api.previewScenario).not.toHaveBeenCalled();
  });

  it("calls previewScenario and exposes the result", async () => {
    api.previewScenario.mockResolvedValue({
      scenario: {
        id: "research_brief",
        title: "Research Brief",
        category: "research",
        description: "",
        pipeline_steps: ["pm"],
        default_gates: [],
        expected_artifacts: [],
        required_tools: [],
        workspace_write_default: false,
        recommended_models: {},
        tags: [],
      },
      pipeline_steps: ["pm"],
      default_gates: [],
      expected_artifacts: [],
      required_tools: [],
      recommended_models: {},
      agent_config: {},
      workspace_write: false,
      warnings: [],
    });

    const { useScenarioPreview } = await import("../useScenarioPreview");
    const id = ref<string | null>("research_brief");
    const { preview, loading } = useScenarioPreview(id, undefined, 0);
    await vi.waitFor(() => {
      expect(loading.value).toBe(false);
      expect(preview.value).not.toBeNull();
    });
    expect(api.previewScenario).toHaveBeenCalledWith("research_brief", {});
    expect(preview.value?.scenario.id).toBe("research_brief");
  });

  it("exposes the error message on failure", async () => {
    api.previewScenario.mockRejectedValue(new Error("scenario not found"));
    const { useScenarioPreview } = await import("../useScenarioPreview");
    const id = ref<string | null>("missing");
    const { preview, error, loading } = useScenarioPreview(id, undefined, 0);
    await vi.waitFor(() => {
      expect(loading.value).toBe(false);
      expect(error.value).toBe("scenario not found");
    });
    expect(preview.value).toBeNull();
  });
});
