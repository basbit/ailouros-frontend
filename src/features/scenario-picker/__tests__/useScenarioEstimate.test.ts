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

describe("useScenarioEstimate.load — empty/null id", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
  });

  it("keeps estimate null when scenario id is null", async () => {
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load(null);
    expect(state.estimate.value).toBeNull();
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(api.getScenarioEstimate).not.toHaveBeenCalled();
  });

  it("resets state and skips fetch on empty string", async () => {
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    state.estimate.value = { scenario_id: "x", total_seconds: 5 } as never;
    state.error.value = "stale";
    state.notImplemented.value = true;
    await state.load("");
    expect(state.estimate.value).toBeNull();
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
    expect(api.getScenarioEstimate).not.toHaveBeenCalled();
  });
});

describe("useScenarioEstimate.load — happy paths", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
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
    const state = useScenarioEstimate();
    await state.load("spec_driven_feature");
    expect(api.getScenarioEstimate).toHaveBeenCalledWith("spec_driven_feature");
    expect(state.estimate.value?.total_seconds).toBe(90);
    expect(state.loading.value).toBe(false);
    expect(state.notImplemented.value).toBe(false);
    expect(state.error.value).toBeNull();
  });

  it("flips loading true during call, false after settle", async () => {
    let resolveCall: ((value: unknown) => void) | null = null;
    api.getScenarioEstimate.mockReturnValue(
      new Promise((resolve) => {
        resolveCall = resolve;
      }),
    );
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    const promise = state.load("x");
    await vi.waitFor(() => expect(resolveCall).not.toBeNull());
    expect(state.loading.value).toBe(true);
    resolveCall!({
      scenario_id: "x",
      steps: [],
      total_seconds: 1,
      essential_seconds: 1,
    });
    await promise;
    expect(state.loading.value).toBe(false);
  });

  it("clears previous error and notImplemented before each new load", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [],
      total_seconds: 5,
      essential_seconds: 0,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    state.error.value = "previous";
    state.notImplemented.value = true;
    await state.load("x");
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });

  it("marks notImplemented when total_seconds is null", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [{ step_id: "a", estimated_duration_sec: null, essential: true }],
      total_seconds: null,
      essential_seconds: null,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("x");
    expect(state.notImplemented.value).toBe(true);
    expect(state.error.value).toBeNull();
    expect(state.estimate.value?.total_seconds).toBeNull();
  });

  it("keeps notImplemented=false when total_seconds is zero (valid value)", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [],
      total_seconds: 0,
      essential_seconds: 0,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("x");
    expect(state.notImplemented.value).toBe(false);
  });
});

describe("useScenarioEstimate.load — error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
  });

  it("exposes the error message on generic failure", async () => {
    api.getScenarioEstimate.mockRejectedValue(new Error("network down"));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("any");
    expect(state.estimate.value).toBeNull();
    expect(state.error.value).toBe("network down");
    expect(state.notImplemented.value).toBe(false);
  });

  it("uses String() fallback for non-Error throwables", async () => {
    api.getScenarioEstimate.mockRejectedValue("string thrown");
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("any");
    expect(state.error.value).toBe("string thrown");
  });

  it("treats 404 ApiError as notImplemented without error", async () => {
    const { ApiError } = await import("@/shared/api/client");
    api.getScenarioEstimate.mockRejectedValue(new ApiError("not found", 404));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("missing");
    expect(state.estimate.value).toBeNull();
    expect(state.notImplemented.value).toBe(true);
    expect(state.error.value).toBeNull();
  });

  it("surfaces non-404 ApiError message", async () => {
    const { ApiError } = await import("@/shared/api/client");
    api.getScenarioEstimate.mockRejectedValue(new ApiError("HTTP 500: down", 500));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("x");
    expect(state.error.value).toBe("HTTP 500: down");
    expect(state.notImplemented.value).toBe(false);
  });

  it("clears loading flag in finally block on error", async () => {
    api.getScenarioEstimate.mockRejectedValue(new Error("boom"));
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("x");
    expect(state.loading.value).toBe(false);
  });
});

describe("useScenarioEstimate.load — token cancellation", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
  });

  it("ignores stale success when a newer load supersedes", async () => {
    let resolveFirst: ((value: unknown) => void) | null = null;
    api.getScenarioEstimate.mockImplementationOnce(
      () => new Promise((resolve) => (resolveFirst = resolve)),
    );
    api.getScenarioEstimate.mockResolvedValueOnce({
      scenario_id: "second",
      steps: [],
      total_seconds: 10,
      essential_seconds: 5,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    const first = state.load("first");
    await state.load("second");
    expect(state.estimate.value?.scenario_id).toBe("second");
    resolveFirst!({
      scenario_id: "first",
      steps: [],
      total_seconds: 99,
      essential_seconds: 99,
    });
    await first;
    expect(state.estimate.value?.scenario_id).toBe("second");
  });

  it("ignores stale failure when a newer load supersedes", async () => {
    let rejectFirst: ((reason: unknown) => void) | null = null;
    api.getScenarioEstimate.mockImplementationOnce(
      () => new Promise((_resolve, reject) => (rejectFirst = reject)),
    );
    api.getScenarioEstimate.mockResolvedValueOnce({
      scenario_id: "second",
      steps: [],
      total_seconds: 10,
      essential_seconds: 5,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    const first = state.load("first");
    await state.load("second");
    rejectFirst!(new Error("stale failure"));
    await first;
    expect(state.estimate.value?.scenario_id).toBe("second");
    expect(state.error.value).toBeNull();
  });
});

describe("useScenarioEstimate.reset", () => {
  beforeEach(() => {
    vi.resetModules();
    api.getScenarioEstimate.mockReset();
  });

  it("clears all state to initial", async () => {
    api.getScenarioEstimate.mockResolvedValue({
      scenario_id: "x",
      steps: [],
      total_seconds: 0,
      essential_seconds: 0,
    });
    const { useScenarioEstimate } = await import("../useScenarioEstimate");
    const state = useScenarioEstimate();
    await state.load("x");
    expect(state.estimate.value).not.toBeNull();
    state.reset();
    expect(state.estimate.value).toBeNull();
    expect(state.loading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.notImplemented.value).toBe(false);
  });
});
