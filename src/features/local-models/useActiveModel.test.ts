import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h, type App } from "vue";

interface ActiveModelHandle {
  view: { value: { kind: string; label: string | null } };
  refresh: () => Promise<void>;
}

function runInComponent<T>(setupFn: () => T): { result: T; app: App } {
  let captured: T | undefined;
  const Host = defineComponent({
    setup() {
      captured = setupFn();
      return () => h("div");
    },
  });
  const app = createApp(Host);
  const host = document.createElement("div");
  app.mount(host);
  if (captured === undefined) {
    throw new Error("setup did not capture value");
  }
  return { result: captured, app };
}

const bridge = vi.hoisted(() => ({
  isDesktop: vi.fn<() => boolean>(),
  probeDesktop: vi.fn<() => Promise<boolean>>(),
  invokeCommand:
    vi.fn<(command: string, args?: Record<string, unknown>) => Promise<unknown>>(),
  listenEvent:
    vi.fn<(name: string, handler: (payload: unknown) => void) => Promise<() => void>>(),
  DESKTOP_EVENTS: { bootstrapProgress: "bootstrap://progress" },
}));

vi.mock("@/shared/lib/desktop-bridge", () => bridge);

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

function modelView(
  overrides: Record<string, unknown> = {},
  entryOverrides: Record<string, unknown> = {},
): unknown {
  return {
    entry: {
      id: "gemma-test",
      label: "Gemma Test",
      family: "gemma",
      params: "E4B",
      quant: "Q4KM",
      format: "gguf",
      size_bytes: 1_000_000,
      source: { url: "https://example/x.gguf", sha256: null },
      license: "TOS",
      default: false,
      supported_runtimes: ["llama.cpp"],
      ...entryOverrides,
    },
    on_disk: false,
    is_default: false,
    ...overrides,
  };
}

describe("useActiveModel — browser fallback", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(false);
  });

  it("reports cloud kind when not in desktop", async () => {
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("cloud");
    expect(state.view.value.label).toBeNull();
    expect(bridge.invokeCommand).not.toHaveBeenCalled();
    app.unmount();
  });

  it("upgrades to desktop via probe when sync check returns false", async () => {
    bridge.isDesktop.mockReturnValue(false);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockResolvedValue([]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(bridge.probeDesktop).toHaveBeenCalled();
    expect(bridge.invokeCommand).toHaveBeenCalledWith("list_available_models");
    app.unmount();
  });
});

describe("useActiveModel — desktop kind=local", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("reports local kind when default model is on disk", async () => {
    bridge.invokeCommand.mockResolvedValue([
      modelView(
        { on_disk: true, is_default: true },
        { id: "gemma-4-e4b", label: "Gemma 4 E4B" },
      ),
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("local");
    expect(state.view.value.label).toBe("Gemma 4 E4B");
    app.unmount();
  });

  it("requires both is_default=true AND on_disk=true to count as local", async () => {
    bridge.invokeCommand.mockResolvedValue([
      modelView({ on_disk: true, is_default: false }),
      modelView({ on_disk: false, is_default: true }),
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    expect(state.view.value.label).toBeNull();
    app.unmount();
  });

  it("picks the first default-and-on-disk entry, ignoring later candidates", async () => {
    bridge.invokeCommand.mockResolvedValue([
      modelView(
        { on_disk: true, is_default: true },
        { id: "first", label: "First match" },
      ),
      modelView({ on_disk: true, is_default: true }, { id: "second", label: "Second" }),
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.label).toBe("First match");
    app.unmount();
  });
});

describe("useActiveModel — desktop kind=none", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
  });

  it("reports none when default model is missing on disk", async () => {
    bridge.invokeCommand.mockResolvedValue([
      modelView({ on_disk: false, is_default: true }),
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    expect(state.view.value.label).toBeNull();
    app.unmount();
  });

  it("reports none when no model is flagged as default", async () => {
    bridge.invokeCommand.mockResolvedValue([
      modelView({ on_disk: true, is_default: false }),
    ]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    app.unmount();
  });

  it("reports none with empty list", async () => {
    bridge.invokeCommand.mockResolvedValue([]);
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    expect(state.view.value.label).toBeNull();
    app.unmount();
  });

  it("resets local presence and label when invokeCommand throws", async () => {
    let phase: "ok" | "fail" = "ok";
    bridge.invokeCommand.mockImplementation(async () => {
      if (phase === "fail") throw new Error("rpc down");
      return [
        modelView(
          { on_disk: true, is_default: true },
          { id: "x", label: "Stale label" },
        ),
      ];
    });
    const { useActiveModel } = await import("./useActiveModel");
    const { result: state, app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await state.refresh();
    expect(state.view.value.kind).toBe("local");
    phase = "fail";
    await state.refresh();
    expect(state.view.value.kind).toBe("none");
    expect(state.view.value.label).toBeNull();
    app.unmount();
  });
});

describe("useActiveModel — onMounted polling", () => {
  beforeEach(() => {
    bridge.isDesktop.mockReturnValue(true);
    bridge.probeDesktop.mockResolvedValue(true);
    bridge.invokeCommand.mockResolvedValue([]);
  });

  it("calls refresh once on mount", async () => {
    const { useActiveModel } = await import("./useActiveModel");
    const { app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await Promise.resolve();
    expect(bridge.invokeCommand).toHaveBeenCalledWith("list_available_models");
    app.unmount();
  });

  it("triggers another refresh at each 30s tick of the interval", async () => {
    vi.useFakeTimers();
    const { useActiveModel } = await import("./useActiveModel");
    const { app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await Promise.resolve();
    const initialCount = bridge.invokeCommand.mock.calls.length;
    vi.advanceTimersByTime(30_000);
    await Promise.resolve();
    expect(bridge.invokeCommand.mock.calls.length).toBeGreaterThan(initialCount);
    app.unmount();
  });

  it("stops polling after unmount", async () => {
    vi.useFakeTimers();
    const { useActiveModel } = await import("./useActiveModel");
    const { app } = runInComponent<ActiveModelHandle>(
      () => useActiveModel() as ActiveModelHandle,
    );
    await Promise.resolve();
    app.unmount();
    const afterUnmount = bridge.invokeCommand.mock.calls.length;
    vi.advanceTimersByTime(120_000);
    await Promise.resolve();
    expect(bridge.invokeCommand.mock.calls.length).toBe(afterUnmount);
  });
});
