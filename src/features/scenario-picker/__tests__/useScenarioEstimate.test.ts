import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("useScenarioEstimate", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
  });

  it("keeps estimate null when scenario id is null", async () => {
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const { estimate, loading, error, notImplemented } = useScenarioEstimate();
    await estimate.value;
    expect(estimate.value).toBeNull();
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
    expect(notImplemented.value).toBe(false);
    expect(api.getScenarioEstimate).not.toHaveBeenCalled();
  });

  it("loads estimate and exposes the result", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "spec_driven_feature",
      steps: [
        { step_id: "a", estimated_duration_sec: 60, essential: true },
        { step_id: "b", estimated_duration_sec: 30, essential: false },
      ],
      total_seconds: 90,
      essential_seconds: 60,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const api2 = useScenarioEstimate();
    await api2.load("spec_driven_feature");
    expect(api.getScenarioEstimate).toHaveBeenCalledWith("spec_driven_feature");
    expect(api2.estimate.value?.total_seconds).toBe(90);
    expect(api2.loading.value).toBe(false);
    expect(api2.notImplemented.value).toBe(false);
  });

  it("marks notImplemented when total_seconds is null", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [{ step_id: "a", estimated_duration_sec: null, essential: true }],
      total_seconds: null,
      essential_seconds: null,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const api2 = useScenarioEstimate();
    await api2.load("x");
    expect(api2.notImplemented.value).toBe(true);
    expect(api2.error.value).toBeNull();
  });

  it("exposes the error message on generic failure", async () => {
    api.getScenarioEstimate.mockRejectedValue(new Error("network down"));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const api2 = useScenarioEstimate();
    await api2.load("any");
    expect(api2.estimate.value).toBeNull();
    expect(api2.error.value).toBe("network down");
    expect(api2.notImplemented.value).toBe(false);
  });

  it("treats 404 ApiError as notImplemented without error", async () => {
    const { ApiError } = await import("@/shared/api/client");
    api.getScenarioEstimate.mockRejectedValue(new ApiError("not found", 404));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const api2 = useScenarioEstimate();
    await api2.load("missing");
    expect(api2.estimate.value).toBeNull();
    expect(api2.notImplemented.value).toBe(true);
    expect(api2.error.value).toBeNull();
  });

  it("reset clears all state", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [],
      total_seconds: 0,
      essential_seconds: 0,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const api2 = useScenarioEstimate();
    await api2.load("x");
    expect(api2.estimate.value).not.toBeNull();
    api2.reset();
    expect(api2.estimate.value).toBeNull();
    expect(api2.loading.value).toBe(false);
    expect(api2.error.value).toBeNull();
    expect(api2.notImplemented.value).toBe(false);
  });
});
