import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";

const apiMod = vi.hoisted(() => ({
  previewScenario:
    vi.fn<(id: string, overrides: Record<string, unknown>) => Promise<unknown>>(),
}));

vi.mock("@/shared/api/endpoints/scenarios", () => apiMod);

beforeEach(() => {
  vi.useFakeTimers();
  apiMod.previewScenario.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe("useScenarioPreview — null scenarioId", () => {
  it("does not call the API when scenarioId starts null", async () => {
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>(null);
      const api = useScenarioPreview(id);
      vi.advanceTimersByTime(1000);
      await flushMicrotasks();
      expect(apiMod.previewScenario).not.toHaveBeenCalled();
      expect(api.preview.value).toBeNull();
      expect(api.loading.value).toBe(false);
      expect(api.error.value).toBeNull();
    });
    scope.stop();
  });

  it("clears state when scenarioId transitions from value to null", async () => {
    apiMod.previewScenario.mockResolvedValue({ scenario_id: "x" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("x");
      const api = useScenarioPreview(id, undefined, 100);
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
      expect(api.preview.value).not.toBeNull();
      id.value = null;
      await flushMicrotasks();
      expect(api.preview.value).toBeNull();
      expect(api.error.value).toBeNull();
      expect(api.loading.value).toBe(false);
    });
    scope.stop();
  });
});

describe("useScenarioPreview — debounce", () => {
  it("calls previewScenario once after debounceMs even with many rapid changes", async () => {
    apiMod.previewScenario.mockResolvedValue({ scenario_id: "z" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("a");
      useScenarioPreview(id, undefined, 500);
      await nextTick();
      id.value = "b";
      await nextTick();
      id.value = "c";
      await nextTick();
      id.value = "d";
      await nextTick();
      vi.advanceTimersByTime(499);
      await flushMicrotasks();
      expect(apiMod.previewScenario).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      await flushMicrotasks();
      expect(apiMod.previewScenario).toHaveBeenCalledTimes(1);
      expect(apiMod.previewScenario).toHaveBeenLastCalledWith("d", {});
    });
    scope.stop();
  });

  it("passes overrides.value to previewScenario", async () => {
    apiMod.previewScenario.mockResolvedValue({ scenario_id: "z" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const overrides = ref({ skip_gates: ["x"] }) as never;
      useScenarioPreview(id, overrides, 100);
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
      expect(apiMod.previewScenario).toHaveBeenCalledWith("z", { skip_gates: ["x"] });
    });
    scope.stop();
  });

  it("re-debounces when overrides change", async () => {
    apiMod.previewScenario.mockResolvedValue({ scenario_id: "z" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const overrides = ref<Record<string, unknown>>({ a: 1 });
      useScenarioPreview(id, overrides as never, 100);
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
      expect(apiMod.previewScenario).toHaveBeenCalledTimes(1);
      overrides.value = { a: 2 };
      await nextTick();
      vi.advanceTimersByTime(100);
      await flushMicrotasks();
      expect(apiMod.previewScenario).toHaveBeenCalledTimes(2);
      expect(apiMod.previewScenario).toHaveBeenLastCalledWith("z", { a: 2 });
    });
    scope.stop();
  });
});

describe("useScenarioPreview — success/failure", () => {
  it("populates preview on success", async () => {
    apiMod.previewScenario.mockResolvedValue({ scenario_id: "z", steps: [] });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      expect(api.preview.value).toEqual({ scenario_id: "z", steps: [] });
      expect(api.loading.value).toBe(false);
      expect(api.error.value).toBeNull();
    });
    scope.stop();
  });

  it("surfaces Error.message on failure and resets preview", async () => {
    apiMod.previewScenario.mockRejectedValue(new Error("backend down"));
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      expect(api.error.value).toBe("backend down");
      expect(api.preview.value).toBeNull();
      expect(api.loading.value).toBe(false);
    });
    scope.stop();
  });

  it("stringifies non-Error throwables on failure", async () => {
    apiMod.previewScenario.mockRejectedValue("string err");
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      expect(api.error.value).toBe("string err");
    });
    scope.stop();
  });

  it("flips loading true during the call, false after settle", async () => {
    let resolveCall: ((value: unknown) => void) | null = null;
    apiMod.previewScenario.mockReturnValue(
      new Promise((resolve) => {
        resolveCall = resolve;
      }),
    );
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("z");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      expect(api.loading.value).toBe(true);
      resolveCall!({ scenario_id: "z" });
      await flushMicrotasks();
      expect(api.loading.value).toBe(false);
    });
    scope.stop();
  });

  it("ignores response from a stale in-flight call when a new id arrives", async () => {
    let resolveFirst: ((value: unknown) => void) | null = null;
    apiMod.previewScenario.mockImplementationOnce(
      () => new Promise((resolve) => (resolveFirst = resolve)),
    );
    apiMod.previewScenario.mockResolvedValueOnce({ scenario_id: "second" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("first");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      id.value = "second";
      await nextTick();
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      expect(api.preview.value).toEqual({ scenario_id: "second" });
      resolveFirst!({ scenario_id: "first" });
      await flushMicrotasks();
      expect(api.preview.value).toEqual({ scenario_id: "second" });
    });
    scope.stop();
  });

  it("does not overwrite preview with null when stale request fails", async () => {
    let rejectFirst: ((reason: unknown) => void) | null = null;
    apiMod.previewScenario.mockImplementationOnce(
      () => new Promise((_resolve, reject) => (rejectFirst = reject)),
    );
    apiMod.previewScenario.mockResolvedValueOnce({ scenario_id: "second" });
    const scope = effectScope();
    await scope.run(async () => {
      const { useScenarioPreview } = await import("./useScenarioPreview");
      const id = ref<string | null>("first");
      const api = useScenarioPreview(id, undefined, 50);
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      id.value = "second";
      await nextTick();
      vi.advanceTimersByTime(50);
      await flushMicrotasks();
      rejectFirst!(new Error("stale fail"));
      await flushMicrotasks();
      expect(api.preview.value).toEqual({ scenario_id: "second" });
      expect(api.error.value).toBeNull();
    });
    scope.stop();
  });
});
